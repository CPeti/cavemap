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
    depth_m: Optional[float] = None
    length_m: Optional[float] = None
    zone: Optional[str] = None
    code: Optional[str] = None

class CaveCreate(CaveBase):
    entrances: Optional[List[EntranceCreate]] = None

class CaveRead(CaveBase):
    cave_id: int
    entrances: List[EntranceRead] = []

    class Config:
        from_attributes = True
