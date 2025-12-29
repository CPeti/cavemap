from src.models.group import Group, GroupMember, GroupInvitation, MemberRole as DBMemberRole, InvitationStatus as DBInvitationStatus
from src.schemas.group import (
    InvitationCreate, InvitationRead, InvitationWithGroup, InvitationResponse, MemberRole
)
from src.auth import User, require_auth
from src.routes.groups import get_group_or_404, get_user_membership, require_group_admin, fetch_usernames

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from src.db.connection import get_session
from datetime import datetime, timezone, timedelta

router = APIRouter()


# --- Create invitation ---
@router.post("/{group_id}/invitations", response_model=InvitationRead, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    group_id: int,
    invitation: InvitationCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Invite a user to join the group. Requires admin privileges."""
    group = await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    # Check if user is already a member
    existing_member = await get_user_membership(session, group_id, invitation.invitee_email)
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this group"
        )
    
    # Check for existing pending invitation
    result = await session.execute(
        select(GroupInvitation).where(
            GroupInvitation.group_id == group_id,
            GroupInvitation.invitee_email == invitation.invitee_email,
            GroupInvitation.status == DBInvitationStatus.PENDING
        )
    )
    existing_invitation = result.scalar_one_or_none()
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending invitation already exists for this user"
        )
    
    # Cannot invite as owner
    if invitation.role == MemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot invite as owner"
        )
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=invitation.expires_in_days or 7)
    
    new_invitation = GroupInvitation(
        group_id=group_id,
        inviter_email=user.email,
        invitee_email=invitation.invitee_email,
        role=DBMemberRole(invitation.role.value),
        expires_at=expires_at
    )
    session.add(new_invitation)
    await session.commit()
    await session.refresh(new_invitation)
    return new_invitation


# --- List group's invitations (for admins) ---
@router.get("/{group_id}/invitations", response_model=list[InvitationRead])
async def list_group_invitations(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all invitations for a group. Requires admin privileges."""
    await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    result = await session.execute(
        select(GroupInvitation)
        .where(GroupInvitation.group_id == group_id)
        .order_by(GroupInvitation.created_at.desc())
    )
    invitations = result.scalars().all()
    
    # Fetch usernames for all involved emails
    emails = set()
    for inv in invitations:
        emails.add(inv.inviter_email)
        emails.add(inv.invitee_email)
    
    usernames_map = await fetch_usernames(list(emails))
    
    # Enrich with usernames
    return [
        InvitationRead(
            invitation_id=inv.invitation_id,
            group_id=inv.group_id,
            inviter_email=inv.inviter_email,
            inviter_username=usernames_map.get(inv.inviter_email, inv.inviter_email.split('@')[0]),
            invitee_email=inv.invitee_email,
            invitee_username=usernames_map.get(inv.invitee_email, inv.invitee_email.split('@')[0]),
            role=MemberRole(inv.role.value),
            status=inv.status.value,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            responded_at=inv.responded_at
        )
        for inv in invitations
    ]


# --- List my pending invitations ---
@router.get("/invitations/me", response_model=list[InvitationWithGroup])
async def list_my_invitations(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all pending invitations for the current user."""
    result = await session.execute(
        select(GroupInvitation)
        .options(selectinload(GroupInvitation.group))
        .where(
            GroupInvitation.invitee_email == user.email,
            GroupInvitation.status == DBInvitationStatus.PENDING
        )
        .order_by(GroupInvitation.created_at.desc())
    )
    
    invitations = []
    for inv in result.scalars().all():
        # Check if expired
        if inv.expires_at and inv.expires_at < datetime.now(timezone.utc):
            inv.status = DBInvitationStatus.EXPIRED
            continue
        
        invitations.append(InvitationWithGroup(
            invitation_id=inv.invitation_id,
            group_id=inv.group_id,
            inviter_email=inv.inviter_email,
            invitee_email=inv.invitee_email,
            role=MemberRole(inv.role.value),
            status=inv.status.value,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            responded_at=inv.responded_at,
            group_name=inv.group.name,
            group_description=inv.group.description
        ))
    
    await session.commit()  # Save any status updates
    return invitations


# --- Respond to invitation ---
@router.post("/invitations/{invitation_id}/respond", response_model=InvitationRead)
async def respond_to_invitation(
    invitation_id: int,
    response: InvitationResponse,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Accept or decline an invitation."""
    result = await session.execute(
        select(GroupInvitation)
        .options(selectinload(GroupInvitation.group))
        .where(GroupInvitation.invitation_id == invitation_id)
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Verify this invitation is for the current user
    if invitation.invitee_email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation is not for you"
        )
    
    # Check if already responded
    if invitation.status != DBInvitationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation has already been {invitation.status.value}"
        )
    
    # Check if expired
    if invitation.expires_at and invitation.expires_at < datetime.now(timezone.utc):
        invitation.status = DBInvitationStatus.EXPIRED
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # Check if group is still active
    if not invitation.group.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The group no longer exists"
        )
    
    invitation.responded_at = datetime.now(timezone.utc)
    
    if response.accept:
        invitation.status = DBInvitationStatus.ACCEPTED
        
        # Add user as member
        new_member = GroupMember(
            group_id=invitation.group_id,
            user_email=user.email,
            role=invitation.role
        )
        session.add(new_member)
    else:
        invitation.status = DBInvitationStatus.DECLINED
    
    await session.commit()
    await session.refresh(invitation)
    return invitation


# --- Cancel invitation (admin) ---
@router.delete("/{group_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invitation(
    group_id: int,
    invitation_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Cancel a pending invitation. Requires admin privileges."""
    await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    result = await session.execute(
        select(GroupInvitation).where(
            GroupInvitation.invitation_id == invitation_id,
            GroupInvitation.group_id == group_id
        )
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if invitation.status != DBInvitationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending invitations"
        )
    
    await session.delete(invitation)
    await session.commit()

