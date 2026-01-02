from src.models.group import Group, GroupMember, MemberRole as DBMemberRole
from src.schemas.group import (
    GroupMemberRead, MemberAdd, MemberRoleUpdate, MemberRole
)
from src.auth import User, require_auth
from src.routes.groups import get_group_or_404, get_user_membership, require_group_admin, require_group_owner

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.db.connection import get_session

router = APIRouter()


# --- List group members ---
@router.get("/{group_id}/members", response_model=list[GroupMemberRead])
async def list_members(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all members of a group. User must be a member."""
    group = await get_group_or_404(session, group_id)
    
    membership = await get_user_membership(session, group_id, user.email)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )
    
    result = await session.execute(
        select(GroupMember).where(GroupMember.group_id == group_id).order_by(GroupMember.role, GroupMember.joined_at)
    )
    members = result.scalars().all()

    # Fetch usernames for all members
    from src.routes.groups import fetch_usernames
    member_emails = [m.user_email for m in members]
    usernames_map = await fetch_usernames(member_emails)

    # Convert to dict format
    member_list = []
    for member in members:
        member_dict = {
            "member_id": member.member_id,
            "username": usernames_map.get(member.user_email, member.user_email.split('@')[0]),
            "role": MemberRole(member.role.value),
            "joined_at": member.joined_at,
            "is_current_user": member.user_email == user.email
        }
        member_list.append(member_dict)

    return member_list


# --- Add member directly (admin function) ---
@router.post("/{group_id}/members", response_model=GroupMemberRead, status_code=status.HTTP_201_CREATED)
async def add_member(
    group_id: int,
    member: MemberAdd,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Add a member directly to the group. Requires admin privileges."""
    await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    # Check if user is already a member
    existing = await get_user_membership(session, group_id, member.user_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this group"
        )
    
    # Cannot add as owner
    if member.role == MemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot directly add a member as owner"
        )
    
    new_member = GroupMember(
        group_id=group_id,
        user_email=member.user_email,
        role=DBMemberRole(member.role.value)
    )
    session.add(new_member)
    await session.commit()
    await session.refresh(new_member)

    # Fetch username for the new member
    from src.routes.groups import fetch_usernames
    usernames_map = await fetch_usernames([new_member.user_email])

    # Return formatted response
    return {
        "member_id": new_member.member_id,
        "username": usernames_map.get(new_member.user_email, new_member.user_email.split('@')[0]),
        "role": MemberRole(new_member.role.value),
        "joined_at": new_member.joined_at,
        "is_current_user": new_member.user_email == user.email
    }


# --- Update member role ---
@router.patch("/{group_id}/members/{member_id}", response_model=GroupMemberRead)
async def update_member_role(
    group_id: int,
    member_id: int,
    update: MemberRoleUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Update a member's role. Requires admin privileges. Owner role requires current owner."""
    await get_group_or_404(session, group_id)

    # Get target member by ID
    result = await session.execute(
        select(GroupMember).where(
            GroupMember.member_id == member_id,
            GroupMember.group_id == group_id
        )
    )
    target_member = result.scalar_one_or_none()
    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Check permissions
    if update.role == MemberRole.OWNER:
        # Transferring ownership requires current owner
        current_owner = await require_group_owner(session, group_id, user.email)
        # Demote current owner to admin
        current_owner.role = DBMemberRole.ADMIN
    elif update.role == MemberRole.ADMIN or target_member.role == DBMemberRole.ADMIN:
        # Only the group owner can grant or revoke admin status
        await require_group_owner(session, group_id, user.email)
    else:
        # Other role updates can be performed by admins or owners
        await require_group_admin(session, group_id, user.email)
    
    # Cannot demote the only owner
    if target_member.role == DBMemberRole.OWNER and update.role != MemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote the owner. Transfer ownership first."
        )
    
    target_member.role = DBMemberRole(update.role.value)
    await session.commit()
    await session.refresh(target_member)

    # Fetch username for the updated member
    from src.routes.groups import fetch_usernames
    usernames_map = await fetch_usernames([target_member.user_email])

    # Return formatted response
    return {
        "member_id": target_member.member_id,
        "username": usernames_map.get(target_member.user_email, target_member.user_email.split('@')[0]),
        "role": MemberRole(target_member.role.value),
        "joined_at": target_member.joined_at,
        "is_current_user": target_member.user_email == user.email
    }


# --- Remove member ---
@router.delete("/{group_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    group_id: int,
    member_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Remove a member from the group. Requires admin privileges, or user can remove themselves."""
    await get_group_or_404(session, group_id)

    # Get target member by ID
    result = await session.execute(
        select(GroupMember).where(
            GroupMember.member_id == member_id,
            GroupMember.group_id == group_id
        )
    )
    target_member = result.scalar_one_or_none()
    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )

    # User can remove themselves (leave group)
    is_self = target_member.user_email == user.email

    if not is_self:
        # Need admin privileges to remove others
        await require_group_admin(session, group_id, user.email)
    
    # Cannot remove the owner
    if target_member.role == DBMemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the group owner. Transfer ownership or delete the group."
        )
    
    await session.delete(target_member)
    await session.commit()


# --- Leave group ---
@router.post("/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Leave a group. Owner cannot leave without transferring ownership."""
    await get_group_or_404(session, group_id)
    
    membership = await get_user_membership(session, group_id, user.email)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this group"
        )
    
    if membership.role == DBMemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner cannot leave. Transfer ownership first or delete the group."
        )
    
    await session.delete(membership)
    await session.commit()

