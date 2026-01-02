from src.models.group import Group, GroupMember, GroupCave
from src.schemas.group import CaveAssign, CaveAssignmentRead, CaveGroupInfo, MemberRole
from src.auth import User, require_auth, require_internal_service
from src.routes.groups import get_group_or_404, get_user_membership, require_group_admin, fetch_usernames

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.db.connection import get_session
import os
import httpx

router = APIRouter()

# Cave service base URL (env var with sensible default)
CAVE_SERVICE_URL = os.getenv("CAVE_SERVICE_URL", "http://cave-service.default.svc.cluster.local")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service.default.svc.cluster.local")

# Service authentication token for internal service-to-service communication
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "dev-service-token-123")


# --- Assign cave to group ---
@router.post("/{group_id}/caves", response_model=CaveAssignmentRead, status_code=status.HTTP_201_CREATED)
async def assign_cave(
    group_id: int,
    cave: CaveAssign,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Assign a cave to this group. Requires admin privileges."""
    await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    # Check if cave is already assigned to this group
    result = await session.execute(
        select(GroupCave).where(
            GroupCave.group_id == group_id,
            GroupCave.cave_id == cave.cave_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cave is already assigned to this group"
        )
    
    # Check if cave is assigned to another group
    result = await session.execute(
        select(GroupCave).where(GroupCave.cave_id == cave.cave_id)
    )
    other_assignment = result.scalar_one_or_none()
    if other_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cave is already assigned to another group"
        )
    
    new_assignment = GroupCave(
        group_id=group_id,
        cave_id=cave.cave_id,
        assigned_by=user.email
    )
    session.add(new_assignment)
    await session.commit()
    await session.refresh(new_assignment)

    # Get cave name from cave service
    cave_name = f"Cave #{cave.cave_id}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CAVE_SERVICE_URL}/caves/{cave.cave_id}",
                headers={"X-Service-Token": SERVICE_TOKEN}
            )
            if response.status_code == 200:
                cave_data = response.json()
                cave_name = cave_data['name']
    except Exception as e:
        print(f"Error fetching cave name for {cave.cave_id}: {e}")
        
    
    # fetch username for assigned_by
    username = new_assignment.assigned_by
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{USER_SERVICE_URL}/users/lookup/{new_assignment.assigned_by}",
                headers={"X-Service-Token": SERVICE_TOKEN}
            )
            if response.status_code == 200:
                user_data = response.json()
                username = user_data['username']
    except Exception as e:
        print(f"Error fetching username for {new_assignment.assigned_by}: {e}")

    return CaveAssignmentRead(
        id=new_assignment.id,
        group_id=new_assignment.group_id,
        cave_id=new_assignment.cave_id,
        cave_name=cave_name,
        assigned_at=new_assignment.assigned_at,
        assigned_by=username
    )

# --- Get groups for a cave ---
@router.get("/caves/{cave_id}/groups", response_model=list[CaveGroupInfo])
async def get_cave_groups(
    cave_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Get all groups that a cave is assigned to."""
    # Query all group assignments for this cave
    result = await session.execute(
        select(GroupCave, Group)
        .join(Group, GroupCave.group_id == Group.group_id)
        .where(GroupCave.cave_id == cave_id, Group.is_active == True)
        .order_by(GroupCave.assigned_at.desc())
    )
    assignments = result.all()
    
    if not assignments:
        return []  # Return empty list instead of 404

    # Fetch usernames for all assigned_by emails
    emails = [gc.assigned_by for gc, _ in assignments]
    usernames_map = await fetch_usernames(emails)

    # Build response with group info
    groups_info = []
    for group_cave, group in assignments:
        groups_info.append(CaveGroupInfo(
            group_id=group.group_id,
            group_name=group.name,
            group_description=group.description,
            assigned_at=group_cave.assigned_at,
            assigned_by=usernames_map.get(group_cave.assigned_by, group_cave.assigned_by.split('@')[0])
        ))
    
    return groups_info


# --- Unassign cave from group ---
@router.delete("/{group_id}/caves/{cave_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_cave(
    group_id: int,
    cave_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Remove a cave from this group. Requires admin privileges."""
    await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    result = await session.execute(
        select(GroupCave).where(
            GroupCave.group_id == group_id,
            GroupCave.cave_id == cave_id
        )
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cave is not assigned to this group"
        )
    
    await session.delete(assignment)
    await session.commit()


# --- Check if user has edit permissions for a cave ---
@router.get("/{cave_id}/permissions/{user_email}")
async def check_cave_permissions(
    cave_id: int,
    user_email: str,
    session: AsyncSession = Depends(get_session)
):
    """Check if a user has edit permissions for a cave through group assignment.
    
    Returns {"can_edit": true} if the cave is assigned to a group and the user is an admin or owner of that group.
    This is an internal service endpoint that doesn't require user authentication.
    """
    # Get the group that this cave is assigned to
    result = await session.execute(
        select(GroupCave).where(GroupCave.cave_id == cave_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        # Cave is not assigned to any group, no permissions through group
        return {"can_edit": False}
    
    # Check if user is admin or owner of the group
    membership = await get_user_membership(session, assignment.group_id, user_email)
    
    if membership and membership.role in [MemberRole.ADMIN, MemberRole.OWNER]:
        return {"can_edit": True}
    
    return {"can_edit": False}


# --- Delete all assignments for a cave (called by cave service) ---
@router.delete("/caves/{cave_id}/assignments", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cave_assignments(
    cave_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_internal_service)
):
    """Delete all cave assignments for a specific cave. Requires service authentication."""
    # This endpoint should only be called by the cave service
    # In a production system, you'd add additional service authentication checks

    result = await session.execute(
        select(GroupCave).where(GroupCave.cave_id == cave_id)
    )
    assignments = result.scalars().all()

    for assignment in assignments:
        await session.delete(assignment)

    await session.commit()


# --- Get cave inheritance candidate ---
@router.get("/caves/{cave_id}/inheritance")
async def get_cave_inheritance_candidate(
    cave_id: int,
    current_owner_email: str = None,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_internal_service)
):
    """Get the email of the user who should inherit a cave ownership.

    Returns the highest rank member (excluding current owner) from groups that the cave is assigned to.
    Priority: owner > admin > member
    Returns None if no suitable candidate exists.
    """
    # Get all groups that this cave is assigned to
    result = await session.execute(
        select(GroupCave, Group)
        .join(Group, GroupCave.group_id == Group.group_id)
        .where(GroupCave.cave_id == cave_id, Group.is_active == True)
    )
    assignments = result.all()

    if not assignments:
        # Cave is not assigned to any groups
        return {
            "action": "delete",
            "inherit_email": None
        }
    
    # Collect all group IDs
    group_ids = [assignment[1].group_id for assignment in assignments]
    
    # Query all members from these groups
    result = await session.execute(
        select(GroupMember)
        .where(GroupMember.group_id.in_(group_ids))
    )
    members = result.scalars().all()
    
    # Filter out current owner and sort by role priority
    # Priority: OWNER > ADMIN > MEMBER
    role_priority = {
        MemberRole.OWNER: 3,
        MemberRole.ADMIN: 2,
        MemberRole.MEMBER: 1
    }
    
    candidates = [
        m for m in members 
        if m.user_email != current_owner_email
    ]
    
    if not candidates:
        # No suitable candidate to inherit ownership
        return {
            "action": "delete",
            "inherit_email": None
        }
    
    # Sort by role priority (descending) and join date (ascending - prefer older members)
    candidates.sort(
        key=lambda m: (-role_priority.get(m.role, 0), m.joined_at)
    )
    
    inherit_email = candidates[0].user_email
    
    return {
        "action": "transfer",
        "inherit_email": inherit_email
    }

