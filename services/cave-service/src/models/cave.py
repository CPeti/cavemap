# models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from src.models.base import Base

class Cave(Base):
    __tablename__ = "caves"

    cave_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String)
    depth_m = Column(Float)
    length_m = Column(Float)
    zone = Column(String)

    entrances = relationship("Entrance", back_populates="cave")


class Entrance(Base):
    __tablename__ = "entrances"

    entrance_id = Column(Integer, primary_key=True, index=True)
    cave_id = Column(Integer, ForeignKey("caves.cave_id"), nullable=False)
    name = Column(String)
    gps_n = Column(Float, nullable=False)
    gps_e = Column(Float, nullable=False)
    asl_m = Column(Float)

    cave = relationship("Cave", back_populates="entrances")
