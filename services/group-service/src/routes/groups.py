from src.models.group import Group, GroupMember, GroupApplication, GroupInvitation, GroupCave, MemberRole as DBMemberRole, JoinPolicy as DBJoinPolicy, ApplicationStatus as DBApplicationStatus
from src.schemas.group import (
    GroupCreate, GroupRead, GroupUpdate, GroupSummary, GroupPublic,
    MemberRole, JoinPolicy
)
from src.auth import User, require_auth

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, delete
from src.db.connection import get_session
import httpx
import os
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# User service URL
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service.default.svc.cluster.local")

# Service authentication token for internal service-to-service communication
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "dev-service-token-123")


# --- Health check endpoint (for K8s probes) ---
@router.get("/health")
def health():
    return {"status": "ok"}


# --- Helper functions ---
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError)),
)
async def _fetch_usernames_with_retry(emails: list[str]) -> dict[str, str]:
    """Fetch usernames from user-service with retries."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{USER_SERVICE_URL}/users/lookup",
            json={"emails": emails},
            headers={"X-Service-Token": SERVICE_TOKEN},
            timeout=5.0
        )
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Failed to fetch usernames: {response.status_code}")
            return {}

async def fetch_usernames(emails: list[str]) -> dict[str, str]:
    """Fetch usernames from user-service for given emails."""
    if not emails:
        return {}
    logger.info(f"fetching usernames for {emails}")
    try:
        return await _fetch_usernames_with_retry(emails)
    except Exception as e:
        logger.error(f"Error fetching usernames after retries: {e}")
        return {}


async def get_group_or_404(session: AsyncSession, group_id: int) -> Group:
    """Get a group by ID or raise 404."""
    result = await session.execute(
        select(Group)
        .options(selectinload(Group.members), selectinload(Group.caves))
        .where(Group.group_id == group_id, Group.is_active == True)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group


async def get_user_membership(session: AsyncSession, group_id: int, user_email: str) -> GroupMember | None:
    """Get user's membership in a group."""
    result = await session.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_email == user_email
        )
    )
    return result.scalar_one_or_none()

async def require_group_admin(session: AsyncSession, group_id: int, user_email: str) -> GroupMember:
    """Require user to be admin or owner of the group."""
    membership = await get_user_membership(session, group_id, user_email)
    if not membership or membership.role not in [DBMemberRole.ADMIN, DBMemberRole.OWNER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return membership


async def require_group_owner(session: AsyncSession, group_id: int, user_email: str) -> GroupMember:
    """Require user to be owner of the group."""
    membership = await get_user_membership(session, group_id, user_email)
    if not membership or membership.role != DBMemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner privileges required"
        )
    return membership


# --- Create group endpoint ---
@router.post("/", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
async def create_group(
    group: GroupCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Create a new expedition group. The creator becomes the owner."""
    # Enforce unique group name (case-insensitive) among active groups
    existing = await session.execute(
        select(Group).where(func.lower(Group.name) == group.name.lower(), Group.is_active == True)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A group with this name already exists"
        )

    # Create the group
    new_group = Group(
        name=group.name,
        description=group.description,
        join_policy=DBJoinPolicy(group.join_policy.value)
    )
    session.add(new_group)
    await session.flush()  # Get group_id

    # Add creator as owner
    owner_member = GroupMember(
        group_id=new_group.group_id,
        user_email=user.email,
        role=DBMemberRole.OWNER
    )
    session.add(owner_member)

    await session.commit()
    await session.refresh(new_group, ["members", "caves"])
    
    # Enrich with usernames from user-service
    emails = [m.user_email for m in new_group.members]
    usernames_map = await fetch_usernames(emails)
    
    # Convert to dict and add usernames
    group_dict = {
        "group_id": new_group.group_id,
        "name": new_group.name,
        "description": new_group.description,
        "join_policy": JoinPolicy(new_group.join_policy.value),
        "created_at": new_group.created_at,
        "updated_at": new_group.updated_at,
        "is_active": new_group.is_active,
        "members": [
            {
                "member_id": m.member_id,
                "user_email": m.user_email,
                "username": usernames_map.get(m.user_email, m.user_email.split('@')[0]),
                "role": MemberRole(m.role.value),
                "joined_at": m.joined_at
            }
            for m in new_group.members
        ],
        "caves": []
    }
    
    return group_dict


# --- List user's groups ---
@router.get("/me", response_model=list[GroupSummary])
async def list_my_groups(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all groups the current user is a member of."""
    # Subquery for member count
    member_count_subq = (
        select(GroupMember.group_id, func.count(GroupMember.member_id).label("member_count"))
        .group_by(GroupMember.group_id)
        .subquery()
    )

    result = await session.execute(
        select(Group, member_count_subq.c.member_count)
        .join(GroupMember, Group.group_id == GroupMember.group_id)
        .outerjoin(member_count_subq, Group.group_id == member_count_subq.c.group_id)
        .where(GroupMember.user_email == user.email, Group.is_active == True)
        .order_by(Group.name)
    )
    
    groups = []
    for group, member_count in result.all():
        groups.append(GroupSummary(
            group_id=group.group_id,
            name=group.name,
            description=group.description,
            join_policy=JoinPolicy(group.join_policy.value),
            created_at=group.created_at,
            is_active=group.is_active,
            member_count=member_count or 0
        ))
    return groups


# --- List all public groups ---
@router.get("/", response_model=list[GroupPublic])
async def list_all_groups(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all active groups with membership status for current user."""
    # Subquery for member count
    member_count_subq = (
        select(GroupMember.group_id, func.count(GroupMember.member_id).label("member_count"))
        .group_by(GroupMember.group_id)
        .subquery()
    )

    # Get user's memberships
    user_memberships = await session.execute(
        select(GroupMember.group_id).where(GroupMember.user_email == user.email)
    )
    user_group_ids = set(row[0] for row in user_memberships.all())

    # Get user's pending applications
    user_applications = await session.execute(
        select(GroupApplication.group_id).where(
            GroupApplication.applicant_email == user.email,
            GroupApplication.status == DBApplicationStatus.PENDING
        )
    )
    pending_application_group_ids = set(row[0] for row in user_applications.all())

    # Get all active groups
    result = await session.execute(
        select(Group, member_count_subq.c.member_count)
        .outerjoin(member_count_subq, Group.group_id == member_count_subq.c.group_id)
        .where(Group.is_active == True)
        .order_by(Group.name)
    )
    
    groups = []
    for group, member_count in result.all():
        groups.append(GroupPublic(
            group_id=group.group_id,
            name=group.name,
            description=group.description,
            join_policy=JoinPolicy(group.join_policy.value),
            created_at=group.created_at,
            member_count=member_count or 0,
            is_member=group.group_id in user_group_ids,
            has_pending_application=group.group_id in pending_application_group_ids
        ))
    return groups


# --- Join an open group ---
@router.post("/{group_id}/join", response_model=GroupRead)
async def join_group(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Join an open group directly."""
    group = await get_group_or_404(session, group_id)
    
    # Check if group is open
    if group.join_policy != DBJoinPolicy.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This group is not open for direct joining. You may need to apply or request an invitation."
        )
    
    # Check if already a member
    existing = await get_user_membership(session, group_id, user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group"
        )
    
    # Add as member
    new_member = GroupMember(
        group_id=group_id,
        user_email=user.email,
        role=DBMemberRole.MEMBER
    )
    session.add(new_member)
    await session.commit()
    await session.refresh(group, ["members", "caves"])

    # Enrich with usernames from user-service
    emails = [m.user_email for m in group.members]
    usernames_map = await fetch_usernames(emails)
    
    # Convert to dict and add usernames
    group_dict = {
        "group_id": group.group_id,
        "name": group.name,
        "description": group.description,
        "join_policy": JoinPolicy(group.join_policy.value),
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "is_active": group.is_active,
        "members": [
            {
                "member_id": m.member_id,
                "user_email": m.user_email,
                "username": usernames_map.get(m.user_email, m.user_email.split('@')[0]),
                "role": MemberRole(m.role.value),
                "joined_at": m.joined_at
            }
            for m in group.members
        ],
        "caves": []
    }
    
    return group_dict


# --- Get group details ---
@router.get("/{group_id}", response_model=GroupRead)
async def get_group(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Get detailed information about a group. User must be a member."""
    group = await get_group_or_404(session, group_id)
    
    # Check membership
    membership = await get_user_membership(session, group_id, user.email)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )
    
    # Enrich with usernames from user-service
    emails = [m.user_email for m in group.members]
    usernames_map = await fetch_usernames(emails)
    
    # Convert to dict and add usernames
    group_dict = {
        "group_id": group.group_id,
        "name": group.name,
        "description": group.description,
        "join_policy": JoinPolicy(group.join_policy.value),
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "is_active": group.is_active,
        "members": [
            {
                "member_id": m.member_id,
                "user_email": m.user_email,
                "username": usernames_map.get(m.user_email, m.user_email.split('@')[0]),
                "role": MemberRole(m.role.value),
                "joined_at": m.joined_at
            }
            for m in group.members
        ],
        "caves": [
            {
                "id": c.id,
                "cave_id": c.cave_id,
                "assigned_at": c.assigned_at,
                "assigned_by": usernames_map.get(c.assigned_by, c.assigned_by.split('@')[0])
            }
            for c in group.caves
        ]
    }
    
    return group_dict


# --- Update group ---
@router.patch("/{group_id}", response_model=GroupRead)
async def update_group(
    group_id: int,
    update: GroupUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Update group details. Requires admin privileges."""
    group = await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    # If name is changing, enforce uniqueness (case-insensitive) among active groups
    if update.name is not None and update.name.lower() != group.name.lower():
        existing = await session.execute(
            select(Group).where(
                func.lower(Group.name) == update.name.lower(),
                Group.is_active == True,
                Group.group_id != group_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A group with this name already exists"
            )

    if update.name is not None:
        group.name = update.name
    if update.description is not None:
        group.description = update.description
    if update.join_policy is not None:
        group.join_policy = DBJoinPolicy(update.join_policy.value)
    
    await session.commit()
    await session.refresh(group, ["members", "caves"])
    
    # Enrich with usernames from user-service
    emails = [m.user_email for m in group.members]
    usernames_map = await fetch_usernames(emails)
    
    # Convert to dict and add usernames
    group_dict = {
        "group_id": group.group_id,
        "name": group.name,
        "description": group.description,
        "join_policy": JoinPolicy(group.join_policy.value),
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "is_active": group.is_active,
        "members": [
            {
                "member_id": m.member_id,
                "user_email": m.user_email,
                "username": usernames_map.get(m.user_email, m.user_email.split('@')[0]),
                "role": MemberRole(m.role.value),
                "joined_at": m.joined_at
            }
            for m in group.members
        ],
        "caves": [
            {
                "id": c.id,
                "cave_id": c.cave_id,
                "assigned_at": c.assigned_at,
                "assigned_by": usernames_map.get(c.assigned_by, c.assigned_by.split('@')[0])
            }
            for c in group.caves
        ]
    }
    
    return group_dict


# --- Delete group ---
@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Delete a group (soft delete). Requires owner privileges."""
    group = await get_group_or_404(session, group_id)
    await require_group_owner(session, group_id, user.email)
    
    group.is_active = False

    # Remove any invitations tied to this group so they don't linger after deletion
    await session.execute(
        delete(GroupInvitation).where(GroupInvitation.group_id == group_id)
    )

    # Remove all cave assignments for this group
    await session.execute(
        delete(GroupCave).where(GroupCave.group_id == group_id)
    )

    await session.commit()

