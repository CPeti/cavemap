from src.models.cave import Cave, Entrance
from src.schemas.cave import CaveCreate, CaveRead

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from src.db.connection import get_session

router = APIRouter()

# --- Health check endpoint (for K8s probes) ---
@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/", response_model=CaveRead, status_code=status.HTTP_201_CREATED)
async def create_cave(cave: CaveCreate, session: AsyncSession = Depends(get_session)):
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

@router.get("/", response_model=list[CaveRead])
async def list_caves(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Cave)
        .options(selectinload(Cave.entrances))
        .order_by(Cave.name)
    )
    return result.scalars().unique().all()


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