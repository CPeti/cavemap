from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from src.models.base import Base
from typing import Optional
from datetime import datetime

class Cave(Base):
    __tablename__ = "caves"

    cave_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    zone = Column(String)
    code = Column(String)
    first_surveyed = Column(String)
    last_surveyed = Column(String)
    length: Mapped[Optional[float]] = mapped_column(Float)
    depth: Mapped[Optional[float]] = mapped_column(Float)
    vertical_extent: Mapped[Optional[float]] = mapped_column(Float)
    horizontal_extent: Mapped[Optional[float]] = mapped_column(Float)
    owner_email = Column(String, nullable=False)  # User who uploaded the cave

    entrances = relationship("Entrance", back_populates="cave", cascade="all, delete-orphan")
    media_files = relationship("CaveMedia", back_populates="cave", cascade="all, delete-orphan")


class Entrance(Base):
    __tablename__ = "entrances"

    entrance_id = Column(Integer, primary_key=True, index=True)
    cave_id = Column(
        Integer,
        ForeignKey("caves.cave_id", ondelete="CASCADE"),
        nullable=False
    )
    name = Column(String)
    gps_n: Mapped[float] = mapped_column(Float, nullable=False)
    gps_e: Mapped[float] = mapped_column(Float, nullable=False)
    asl_m: Mapped[Optional[float]] = mapped_column(Float)

    cave = relationship("Cave", back_populates="entrances")


class CaveMedia(Base):
    __tablename__ = "cave_media"

    cave_id = Column(
        Integer,
        ForeignKey("caves.cave_id", ondelete="CASCADE"),
        primary_key=True
    )
    media_file_id = Column(Integer, primary_key=True)
    added_by = Column(String, nullable=False)  # User email who associated the media
    added_at = Column(DateTime, default=datetime.utcnow)

    cave = relationship("Cave", back_populates="media_files")