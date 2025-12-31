from src.models.cave import Cave, Entrance
from src.schemas.cave import CaveCreate, CaveRead, UserStats, EntranceCreate, EntranceRead
from src.auth import User, get_current_user, require_auth

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from src.db.connection import get_session
from typing import Optional
import httpx
import os

router = APIRouter()

# User service URL
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service.default.svc.cluster.local")

# Group service URL
GROUP_SERVICE_URL = os.getenv("GROUP_SERVICE_URL", "http://group-service.default.svc.cluster.local")

# Service authentication token for internal service-to-service communication
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "dev-service-token-123")


async def fetch_usernames(emails: list[str]) -> dict[str, str]:
    """Fetch usernames from user-service for given emails."""
    if not emails:
        return {}
    print(f"fetching usernames for {emails}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{USER_SERVICE_URL}/users/lookup",
                json={"emails": emails},
                timeout=5.0
            )
            print(response.text)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to fetch usernames: {response.status_code}")
                return {}
    except Exception as e:
        print(f"Error fetching usernames: {e}")
        return {}


# --- Health check endpoint (for K8s probes) ---
# Public - no auth required
@router.get("/health")
def health():
    return {"status": "ok"}




# --- Zone list endpoint ---
# Public - no auth required
@router.get("/zones", response_model=list[str])
async def list_zones(session: AsyncSession = Depends(get_session)):
    """Get all unique zones for filtering."""
    result = await session.execute(
        select(Cave.zone)
        .where(Cave.zone.isnot(None))
        .distinct()
        .order_by(Cave.zone)
    )
    return [zone for zone in result.scalars().all() if zone]


# --- Create cave endpoint ---
# Protected - requires authentication
@router.post("/", response_model=CaveRead, status_code=status.HTTP_201_CREATED)
async def create_cave(
    cave: CaveCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    # Check if name already exists
    name_exists = await session.scalar(
        select(Cave.cave_id).where(Cave.name == cave.name)
    )
    if name_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cave name already exists."
        )

    # Create cave
    new_cave = Cave(
        name=cave.name,
        zone=cave.zone,
        code=cave.code,
        first_surveyed=cave.first_surveyed,
        last_surveyed=cave.last_surveyed,
        length=cave.length,
        depth=cave.depth,
        vertical_extent=cave.vertical_extent,
        horizontal_extent=cave.horizontal_extent,
        owner_email=user.email
    )
    session.add(new_cave)
    
    # Add entrances if provided
    if cave.entrances:
        await session.flush()  # Get cave_id
        entrances = [
            Entrance(
                cave_id=new_cave.cave_id,
                name=ent.name,
                gps_n=ent.gps_n,
                gps_e=ent.gps_e,
                asl_m=ent.asl_m
            )
            for ent in cave.entrances
        ]
        session.add_all(entrances)

    await session.commit()
    await session.refresh(new_cave, ["entrances"])

    # Fetch username for owner
    usernames_map = await fetch_usernames([user.email])

    # Convert to dict format expected by schema
    cave_dict = {
        "cave_id": new_cave.cave_id,
        "name": new_cave.name,
        "zone": new_cave.zone,
        "code": new_cave.code,
        "first_surveyed": new_cave.first_surveyed,
        "last_surveyed": new_cave.last_surveyed,
        "length": new_cave.length,
        "depth": new_cave.depth,
        "vertical_extent": new_cave.vertical_extent,
        "horizontal_extent": new_cave.horizontal_extent,
        "owner_username": usernames_map.get(user.email, user.email.split('@')[0]),
        "is_owner": True,  # User just created this cave, so they own it
        "entrances": [
            {
                "entrance_id": e.entrance_id,
                "name": e.name,
                "gps_n": e.gps_n,
                "gps_e": e.gps_e,
                "asl_m": e.asl_m
            }
            for e in new_cave.entrances
        ]
    }

    return cave_dict


# --- Create entrance for a cave ---
# Protected - requires authentication and cave ownership
@router.post("/{cave_id}/entrances", response_model=EntranceRead, status_code=status.HTTP_201_CREATED)
async def create_entrance(
    cave_id: int,
    entrance: EntranceCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Create a new entrance for a cave. Only the cave owner can add entrances."""

    # Get the cave and check ownership
    result = await session.execute(
        select(Cave).where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()
    if cave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cave not found")

    if cave.owner_email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add entrances to caves that you own"
        )

    # Create entrance
    new_entrance = Entrance(
        cave_id=cave_id,
        name=entrance.name,
        gps_n=entrance.gps_n,
        gps_e=entrance.gps_e,
        asl_m=entrance.asl_m
    )
    session.add(new_entrance)
    await session.commit()
    await session.refresh(new_entrance)

    return new_entrance


# --- Update entrance ---
# Protected - requires authentication and cave ownership
@router.put("/{cave_id}/entrances/{entrance_id}", response_model=EntranceRead)
async def update_entrance(
    cave_id: int,
    entrance_id: int,
    entrance_update: EntranceCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Update an entrance. Only the cave owner can modify entrances."""

    # Get the cave and check ownership
    result = await session.execute(
        select(Cave).where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()
    if cave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cave not found")

    if cave.owner_email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify entrances of caves that you own"
        )

    # Get the entrance
    result = await session.execute(
        select(Entrance).where(
            Entrance.entrance_id == entrance_id,
            Entrance.cave_id == cave_id
        )
    )
    entrance = result.scalar_one_or_none()
    if entrance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrance not found")

    # Update entrance fields
    entrance.name = entrance_update.name
    entrance.gps_n = entrance_update.gps_n
    entrance.gps_e = entrance_update.gps_e
    entrance.asl_m = entrance_update.asl_m

    await session.commit()
    await session.refresh(entrance)

    return entrance


# --- Delete entrance ---
# Protected - requires authentication and cave ownership
@router.delete("/{cave_id}/entrances/{entrance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entrance(
    cave_id: int,
    entrance_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Delete an entrance. Only the cave owner can delete entrances."""

    # Get the cave and check ownership
    result = await session.execute(
        select(Cave).where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()
    if cave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cave not found")

    if cave.owner_email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete entrances of caves that you own"
        )

    # Get the entrance
    result = await session.execute(
        select(Entrance).where(
            Entrance.entrance_id == entrance_id,
            Entrance.cave_id == cave_id
        )
    )
    entrance = result.scalar_one_or_none()

    if entrance is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrance not found")

    await session.delete(entrance)
    await session.commit()


# --- List caves endpoint ---
# Public - no auth required
@router.get("/", response_model=list[CaveRead])
async def list_caves(
    session: AsyncSession = Depends(get_session),
    search: Optional[str] = Query(None, description="Search caves by name (case-insensitive)"),
    zone: Optional[str] = Query(None, description="Filter by zone"),
    depth_min: Optional[float] = Query(None, description="Minimum vertical extent (depth)"),
    depth_max: Optional[float] = Query(None, description="Maximum vertical extent (depth)"),
    length_min: Optional[float] = Query(None, description="Minimum length"),
    length_max: Optional[float] = Query(None, description="Maximum length"),
    limit: Optional[int] = Query(None, description="Limit number of results"),
):
    """List caves with optional filtering."""
    query = select(Cave).options(selectinload(Cave.entrances))
    
    # Apply filters
    if search:
        query = query.where(Cave.name.ilike(f"%{search}%"))
    if zone:
        query = query.where(Cave.zone == zone)
    if depth_min is not None:
        query = query.where(Cave.depth >= depth_min)
    if depth_max is not None:
        query = query.where(Cave.depth <= depth_max)
    if length_min is not None:
        query = query.where(Cave.length >= length_min)
    if length_max is not None:
        query = query.where(Cave.length <= length_max)
    
    query = query.order_by(Cave.name)
    if limit is not None:
        query = query.limit(limit)
    result = await session.execute(query)
    caves = result.scalars().unique().all()

    # Get all unique owner emails for username lookup
    owner_emails = list(set(cave.owner_email for cave in caves))
    usernames_map = await fetch_usernames(owner_emails)

    # Convert to dict format
    cave_list = []
    for cave in caves:
        cave_dict = {
            "cave_id": cave.cave_id,
            "name": cave.name,
            "zone": cave.zone,
            "code": cave.code,
            "first_surveyed": cave.first_surveyed,
            "last_surveyed": cave.last_surveyed,
            "length": cave.length,
            "depth": cave.depth,
            "vertical_extent": cave.vertical_extent,
            "horizontal_extent": cave.horizontal_extent,
            "owner_username": usernames_map.get(cave.owner_email, cave.owner_email.split('@')[0]),
            "is_owner": False,  # Public endpoint, can't determine ownership
            "entrances": [
                {
                    "entrance_id": e.entrance_id,
                    "name": e.name,
                    "gps_n": e.gps_n,
                    "gps_e": e.gps_e,
                    "asl_m": e.asl_m
                }
                for e in cave.entrances
            ]
        }
        cave_list.append(cave_dict)

    return cave_list


# --- Delete all caves (TESTING ONLY) ---
@router.delete("/delete_all", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_caves(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Delete all caves and their entrances. For testing purposes only."""
    result = await session.execute(select(Cave))
    caves = result.scalars().all()

    # Get all cave IDs before deleting
    cave_ids = [cave.cave_id for cave in caves]

    # Notify group service to delete assignments for all caves
    for cave_id in cave_ids:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{GROUP_SERVICE_URL}/groups/caves/{cave_id}/assignments",
                    headers={"X-Service-Token": SERVICE_TOKEN}
                )
                if response.status_code not in [200, 204]:
                    print(f"Warning: Failed to delete cave assignments for cave {cave_id}: {response.status_code}")
        except Exception as e:
            print(f"Warning: Error notifying group service about cave {cave_id} deletion: {e}")

    for cave in caves:
        await session.delete(cave)

    await session.commit()


# --- Get single cave endpoint ---
# Public - no auth required
@router.get("/{cave_id}", response_model=CaveRead)
async def get_cave(cave_id: int, session: AsyncSession = Depends(get_session), user: User = Depends(require_auth)):
    result = await session.execute(
        select(Cave)
        .options(selectinload(Cave.entrances))
        .where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()
    if cave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cave not found")

    # Fetch username for owner
    print(f"fetching usernames for {cave.owner_email}")
    usernames_map = await fetch_usernames([cave.owner_email])
    print(f"Usernames map: {usernames_map}")


    # Check if current user is the owner
    is_owner = cave.owner_email == user.email

    # Convert to dict and add username and ownership info
    cave_dict = {
        "cave_id": cave.cave_id,
        "name": cave.name,
        "zone": cave.zone,
        "code": cave.code,
        "first_surveyed": cave.first_surveyed,
        "last_surveyed": cave.last_surveyed,
        "length": cave.length,
        "depth": cave.depth,
        "vertical_extent": cave.vertical_extent,
        "horizontal_extent": cave.horizontal_extent,
        "owner_username": usernames_map.get(cave.owner_email, cave.owner_email.split('@')[0]),
        "is_owner": is_owner,
        "entrances": [
            {
                "entrance_id": e.entrance_id,
                "name": e.name,
                "gps_n": e.gps_n,
                "gps_e": e.gps_e,
                "asl_m": e.asl_m
            }
            for e in cave.entrances
        ]
    }

    return cave_dict


# --- Update cave endpoint ---
# Protected - requires authentication and ownership
@router.put("/{cave_id}", response_model=CaveRead)
async def update_cave(
    cave_id: int,
    cave_update: CaveCreate,  # Reuse the create schema for updates
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Update a cave. Only the owner can update their caves."""

    # Get the cave
    result = await session.execute(
        select(Cave)
        .options(selectinload(Cave.entrances))
        .where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()
    if cave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cave not found")

    # Check ownership
    if cave.owner_email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit caves that you own"
        )

    # Check if new name conflicts with existing caves
    if cave_update.name != cave.name:
        name_exists = await session.scalar(
            select(Cave.cave_id).where(Cave.name == cave_update.name, Cave.cave_id != cave_id)
        )
        if name_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cave name already exists."
            )

    # Update cave fields
    cave.name = cave_update.name
    cave.zone = cave_update.zone
    cave.code = cave_update.code
    cave.first_surveyed = cave_update.first_surveyed
    cave.last_surveyed = cave_update.last_surveyed
    cave.length = cave_update.length
    cave.depth = cave_update.depth
    cave.vertical_extent = cave_update.vertical_extent
    cave.horizontal_extent = cave_update.horizontal_extent

    # For now, we'll keep entrances as-is (could be updated separately if needed)

    await session.commit()
    await session.refresh(cave, ["entrances"])

    # Fetch username for owner
    usernames_map = await fetch_usernames([cave.owner_email])

    # Convert to dict format expected by schema
    cave_dict = {
        "cave_id": cave.cave_id,
        "name": cave.name,
        "zone": cave.zone,
        "code": cave.code,
        "first_surveyed": cave.first_surveyed,
        "last_surveyed": cave.last_surveyed,
        "length": cave.length,
        "depth": cave.depth,
        "vertical_extent": cave.vertical_extent,
        "horizontal_extent": cave.horizontal_extent,
        "owner_username": usernames_map.get(cave.owner_email, cave.owner_email.split('@')[0]),
        "is_owner": True,  # User updated this cave, so they own it
        "entrances": [
            {
                "entrance_id": e.entrance_id,
                "name": e.name,
                "gps_n": e.gps_n,
                "gps_e": e.gps_e,
                "asl_m": e.asl_m
            }
            for e in cave.entrances
        ]
    }

    return cave_dict


# --- Delete cave endpoint ---
# Protected - requires authentication and ownership
@router.delete("/{cave_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cave(
    cave_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Delete a cave and all its entrances. Only the owner can delete their caves."""

    # Get the cave and check ownership
    result = await session.execute(
        select(Cave).where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()
    if cave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cave not found")

    if cave.owner_email != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete caves that you own"
        )

    # Notify group service to delete cave assignments
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{GROUP_SERVICE_URL}/groups/caves/{cave_id}/assignments",
                headers={"X-Service-Token": SERVICE_TOKEN}
            )
            if response.status_code not in [200, 204]:
                print(f"Warning: Failed to delete cave assignments from group service: {response.status_code}")
    except Exception as e:
        print(f"Warning: Error notifying group service about cave deletion: {e}")

    # Delete the cave (entrances will be cascade deleted due to relationship)
    await session.delete(cave)
    await session.commit()


# --- Get user statistics endpoint ---
# Protected - requires authentication
@router.get("/stats/me", response_model=UserStats)
async def get_user_stats(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Get statistics for the authenticated user."""

    # Get count of caves uploaded by this user
    caves_count_result = await session.execute(
        select(func.count(Cave.cave_id))
        .where(Cave.owner_email == user.email)
    )
    caves_uploaded = caves_count_result.scalar() or 0

    # Get sum of lengths for caves uploaded by this user
    total_length_result = await session.execute(
        select(func.sum(Cave.length))
        .where(Cave.owner_email == user.email, Cave.length.isnot(None))
    )
    total_length = total_length_result.scalar() or 0.0

    # Get sum of depths for caves uploaded by this user
    total_depth_result = await session.execute(
        select(func.sum(Cave.depth))
        .where(Cave.owner_email == user.email, Cave.depth.isnot(None))
    )
    total_depth = total_depth_result.scalar() or 0.0

    return UserStats(
        caves_uploaded=caves_uploaded,
        total_length=total_length,
        total_depth=total_depth
    )
    
    # --- uUpload list of caves ()TES# --- Upload list of caves (TESTING ONLY) ---# --- Upload list of caves (TESTING ONLY) ---
@router.post("/bulk_upload", status_code=status.HTTP_201_CREATED)
async def bulk_upload_caves(
    caves: list[CaveCreate],
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_auth)
):
    """Bulk upload caves. For testing purposes only."""
    created_caves = []
    for cave_data in caves:
        new_cave = Cave(
            name=cave_data.name,
            zone=cave_data.zone,
            code=cave_data.code,
            first_surveyed=cave_data.first_surveyed,
            last_surveyed=cave_data.last_surveyed,
            length=cave_data.length,
            depth=cave_data.depth,
            vertical_extent=cave_data.vertical_extent,
            horizontal_extent=cave_data.horizontal_extent,
            owner_email=user.email
        )
        session.add(new_cave)
        await session.flush()  # Get cave_id

        # Add entrances if provided
        if cave_data.entrances:
            entrances = [
                Entrance(
                    cave_id=new_cave.cave_id,
                    name=ent.name,
                    gps_n=ent.gps_n,
                    gps_e=ent.gps_e,
                    asl_m=ent.asl_m
                )
                for ent in cave_data.entrances
            ]
            session.add_all(entrances)

        created_caves.append(new_cave)

    await session.commit()
    return {"created": len(created_caves)}