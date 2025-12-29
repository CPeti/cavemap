# schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

class EntranceBase(BaseModel):
    name: Optional[str] = None
    gps_n: float = Field(..., description="Latitude (N)")
    gps_e: float = Field(..., description="Longitude (E)")
    asl_m: Optional[float] = None

class EntranceCreate(EntranceBase):
    pass

class EntranceRead(EntranceBase):
    entrance_id: int

    class Config:
        from_attributes = True


class CaveBase(BaseModel):
    name: str
    zone: Optional[str] = None
    code: Optional[str] = None
    first_surveyed: Optional[str] = None
    last_surveyed: Optional[str] = None
    length: Optional[float] = None
    depth: Optional[float] = None
    vertical_extent: Optional[float] = None
    horizontal_extent: Optional[float] = None
    

class CaveCreate(CaveBase):
    entrances: Optional[List[EntranceCreate]] = None

class CaveRead(CaveBase):
    cave_id: int
    owner_username: str
    is_owner: bool
    entrances: List[EntranceRead] = []

    class Config:
        from_attributes = True

class UserStats(BaseModel):
    """Statistics for a user."""
    caves_uploaded: int
    total_length: float
    total_depth: float