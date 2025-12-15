from src.models.cave import Cave, Entrance
from src.schemas.cave import CaveCreate, CaveRead
from src.auth import User, get_current_user, require_auth

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from src.db.connection import get_session
from typing import Optional

router = APIRouter()


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
        horizontal_extent=cave.horizontal_extent
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
    return new_cave


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
    return result.scalars().unique().all()


# --- Get single cave endpoint ---
# Public - no auth required
@router.get("/{cave_id}", response_model=CaveRead)
async def get_cave(cave_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Cave)
        .options(selectinload(Cave.entrances))
        .where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()
    if cave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cave not found")
    return cave