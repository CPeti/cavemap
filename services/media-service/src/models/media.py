from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from src.models.base import Base
from typing import Optional
from datetime import datetime

class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False, unique=True, index=True)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Blob storage path
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)  # User email
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    container_name = Column(String, nullable=False)

    # Relationships
    file_metadata = relationship("MediaMetadata", back_populates="media_file", cascade="all, delete-orphan")


class MediaMetadata(Base):
    __tablename__ = "media_metadata"

    id = Column(Integer, primary_key=True, index=True)
    media_file_id = Column(
        Integer,
        ForeignKey("media_files.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    key = Column(String, nullable=False)  # e.g., "width", "height", "duration"
    value = Column(Text, nullable=False)  # Store as text, can be parsed based on type
    metadata_type = Column(String, nullable=False)  # "string", "number", "boolean"

    # Relationships
    media_file = relationship("MediaFile", back_populates="file_metadata")
