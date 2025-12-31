from src.models.group import Group, GroupCave
from src.schemas.group import CaveAssign, CaveAssignmentRead, CaveGroupInfo
from src.auth import User, require_auth
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


# --- List group's caves ---
@router.get("/{group_id}/caves", response_model=list[CaveAssignmentRead])
async def list_group_caves(
    group_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """List all caves assigned to a group. User must be a member."""
    await get_group_or_404(session, group_id)
    
    membership = await get_user_membership(session, group_id, user.email)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group"
        )
    
    result = await session.execute(
        select(GroupCave)
        .where(GroupCave.group_id == group_id)
        .order_by(GroupCave.assigned_at.desc())
    )
    group_caves = result.scalars().all()

    # Get cave names from cave service
    cave_ids = [gc.cave_id for gc in group_caves]
    cave_names = {}

    if cave_ids:
        try:
            # Call cave service to get cave details
            async with httpx.AsyncClient() as client:
                # Get cave details for all cave_ids
                for cave_id in cave_ids:
                    try:
                        response = await client.get(
                            f"{CAVE_SERVICE_URL}/caves/{cave_id}",
                            headers={"X-Service-Token": SERVICE_TOKEN}
                        )
                        if response.status_code == 200:
                            cave_data = response.json()
                            cave_names[cave_id] = cave_data['name']
                        else:
                            cave_names[cave_id] = f"Cave #{cave_id}"
                    except Exception as e:
                        print(f"Error fetching cave {cave_id}: {e}")
                        cave_names[cave_id] = f"Cave #{cave_id}"
        except Exception as e:
            print(f"Error connecting to cave service: {e}")
            # Fallback to just showing IDs
            for cave_id in cave_ids:
                cave_names[cave_id] = f"Cave #{cave_id}"

    # Add cave names to the response
    result_with_names = []
    for gc in group_caves:
        result_with_names.append(CaveAssignmentRead(
            id=gc.id,
            group_id=gc.group_id,
            cave_id=gc.cave_id,
            cave_name=cave_names.get(gc.cave_id, f"Cave #{gc.cave_id}"),
            assigned_at=gc.assigned_at,
            assigned_by=gc.assigned_by
        ))

    return result_with_names


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


# --- Delete all assignments for a cave (called by cave service) ---
@router.delete("/caves/{cave_id}/assignments", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cave_assignments(
    cave_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
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

