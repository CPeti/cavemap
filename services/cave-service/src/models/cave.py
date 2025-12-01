from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from src.models.base import Base
from typing import Optional

class Cave(Base):
    __tablename__ = "caves"

    cave_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    zone = Column(String)
    code = Column(String)
    first_surveyed = Column(String)
    last_surveyed = Column(String)
    length: Mapped[Optional[float]] = mapped_column(Float)
    vertical_extent: Mapped[Optional[float]] = mapped_column(Float)
    horizontal_extent: Mapped[Optional[float]] = mapped_column(Float)

    entrances = relationship("Entrance", back_populates="cave")


class Entrance(Base):
    __tablename__ = "entrances"

    entrance_id = Column(Integer, primary_key=True, index=True)
    cave_id = Column(Integer, ForeignKey("caves.cave_id"), nullable=False)
    name = Column(String)
    gps_n: Mapped[float] = mapped_column(Float, nullable=False)
    gps_e: Mapped[float] = mapped_column(Float, nullable=False)
    asl_m: Mapped[Optional[float]] = mapped_column(Float)

    cave = relationship("Cave", back_populates="entrances")
