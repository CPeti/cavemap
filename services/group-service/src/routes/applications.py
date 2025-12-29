from src.models.group import Group, GroupMember, GroupApplication, MemberRole as DBMemberRole, JoinPolicy as DBJoinPolicy, ApplicationStatus as DBApplicationStatus
from src.schemas.group import (
    ApplicationCreate, ApplicationRead, ApplicationWithGroup, ApplicationReview, ApplicationStatus
)
from src.auth import User, require_auth
from src.routes.groups import get_group_or_404, get_user_membership, require_group_admin, fetch_usernames

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from src.db.connection import get_session
from datetime import datetime, timezone

router = APIRouter()


# --- Apply to join a group ---
@router.post("/{group_id}/apply", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def apply_to_group(
    group_id: int,
    application: ApplicationCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Apply to join a group that requires applications."""
    group = await get_group_or_404(session, group_id)
    
    # Check if group accepts applications
    if group.join_policy != DBJoinPolicy.APPLICATION:
        if group.join_policy == DBJoinPolicy.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This group is open. You can join directly without applying."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This group is invite-only and does not accept applications."
            )
    
    # Check if already a member
    existing_member = await get_user_membership(session, group_id, user.email)
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this group"
        )
    
    # Check for existing pending application
    result = await session.execute(
        select(GroupApplication).where(
            GroupApplication.group_id == group_id,
            GroupApplication.applicant_email == user.email,
            GroupApplication.status == DBApplicationStatus.PENDING
        )
    )
    existing_application = result.scalar_one_or_none()
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending application for this group"
        )
    
    new_application = GroupApplication(
        group_id=group_id,
        applicant_email=user.email,
        message=application.message
    )
    session.add(new_application)
    await session.commit()
    await session.refresh(new_application)
    return new_application


# --- List group's pending applications (for admins) ---
@router.get("/{group_id}/applications", response_model=list[ApplicationRead])
async def list_group_applications(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all pending applications for a group. Requires admin privileges."""
    await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    result = await session.execute(
        select(GroupApplication)
        .where(GroupApplication.group_id == group_id)
        .order_by(GroupApplication.created_at.desc())
    )
    applications = result.scalars().all()
    
    # Fetch usernames for all applicants
    emails = [app.applicant_email for app in applications]
    usernames_map = await fetch_usernames(emails)
    
    # Enrich with usernames
    return [
        ApplicationRead(
            application_id=app.application_id,
            group_id=app.group_id,
            applicant_email=app.applicant_email,
            applicant_username=usernames_map.get(app.applicant_email, app.applicant_email.split('@')[0]),
            message=app.message,
            status=ApplicationStatus(app.status.value),
            created_at=app.created_at,
            reviewed_at=app.reviewed_at,
            reviewed_by=app.reviewed_by
        )
        for app in applications
    ]


# --- List my pending applications ---
@router.get("/applications/me", response_model=list[ApplicationWithGroup])
async def list_my_applications(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all applications submitted by the current user."""
    result = await session.execute(
        select(GroupApplication)
        .options(selectinload(GroupApplication.group))
        .where(GroupApplication.applicant_email == user.email)
        .order_by(GroupApplication.created_at.desc())
    )
    
    applications = []
    for app in result.scalars().all():
        applications.append(ApplicationWithGroup(
            application_id=app.application_id,
            group_id=app.group_id,
            applicant_email=app.applicant_email,
            message=app.message,
            status=ApplicationStatus(app.status.value),
            created_at=app.created_at,
            reviewed_at=app.reviewed_at,
            reviewed_by=app.reviewed_by,
            group_name=app.group.name,
            group_description=app.group.description
        ))
    
    return applications


# --- Review application (approve/reject) ---
@router.post("/{group_id}/applications/{application_id}/review", response_model=ApplicationRead)
async def review_application(
    group_id: int,
    application_id: int,
    review: ApplicationReview,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Approve or reject an application. Requires admin privileges."""
    await get_group_or_404(session, group_id)
    await require_group_admin(session, group_id, user.email)
    
    result = await session.execute(
        select(GroupApplication).where(
            GroupApplication.application_id == application_id,
            GroupApplication.group_id == group_id
        )
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    if application.status != DBApplicationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application has already been {application.status.value}"
        )
    
    application.reviewed_at = datetime.now(timezone.utc)
    application.reviewed_by = user.email
    
    if review.approve:
        application.status = DBApplicationStatus.APPROVED
        
        # Add user as member
        new_member = GroupMember(
            group_id=group_id,
            user_email=application.applicant_email,
            role=DBMemberRole.MEMBER
        )
        session.add(new_member)
    else:
        application.status = DBApplicationStatus.REJECTED
    
    await session.commit()
    await session.refresh(application)
    return application


# --- Cancel my application ---
@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_my_application(
    application_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Cancel your own pending application."""
    result = await session.execute(
        select(GroupApplication).where(
            GroupApplication.application_id == application_id,
            GroupApplication.applicant_email == user.email
        )
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    if application.status != DBApplicationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending applications"
        )
    
    await session.delete(application)
    await session.commit()

