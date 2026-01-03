from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class MediaMetadataBase(BaseModel):
    key: str
    value: str
    metadata_type: str

class MediaMetadataCreate(MediaMetadataBase):
    pass

class MediaMetadata(MediaMetadataBase):
    id: int
    media_file_id: int

    class Config:
        from_attributes = True

class MediaFileBase(BaseModel):
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    content_type: str
    uploaded_by: str
    container_name: str

class MediaFileCreate(BaseModel):
    original_filename: str
    content_type: str
    uploaded_by: str
    metadata: Optional[List[MediaMetadataCreate]] = []

class MediaFile(MediaFileBase):
    id: int
    uploaded_at: datetime
    metadata: List[MediaMetadata] = []

    class Config:
        from_attributes = True

class MediaFileList(BaseModel):
    id: int
    filename: str
    original_filename: str
    content_type: str
    file_size: int
    uploaded_by: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class UploadResponse(BaseModel):
    media_file: MediaFile
    download_url: str

class MediaFileUpdate(BaseModel):
    original_filename: Optional[str] = None
    metadata: Optional[List[MediaMetadataCreate]] = None
