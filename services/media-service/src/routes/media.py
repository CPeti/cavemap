import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import io

from src.db.connection import get_session
from src.models.media import MediaFile, MediaMetadata
from src.schemas.media import (
    MediaFile as MediaFileSchema,
    MediaFileList,
    MediaFileCreate,
    MediaFileUpdate,
    UploadResponse,
    MediaMetadataCreate
)
from pydantic import BaseModel


class BatchMediaRequest(BaseModel):
    media_file_ids: List[int]
from src.utils.azure_storage import azure_storage
from src.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    uploaded_by: str = Query(..., description="Email of the user uploading the file"),
    session: AsyncSession = Depends(get_session)
):
    """Upload a file to Azure Blob Storage and store metadata in database."""
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())

        # Read file content
        file_content = await file.read()

        # Upload to Azure Blob Storage
        blob_url = await azure_storage.upload_file(
            file_data=io.BytesIO(file_content),
            blob_name=unique_filename,
            content_type=file.content_type
        )

        # Create database record
        media_file = MediaFile(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=blob_url,
            file_size=len(file_content),
            content_type=file.content_type,
            uploaded_by=uploaded_by,
            container_name=settings.azure_storage_container_name
        )

        session.add(media_file)
        await session.commit()
        await session.refresh(media_file)

        # Generate download URL
        download_url = await azure_storage.get_file_url(unique_filename)

        # Extract and store basic metadata
        metadata_entries = []

        # Add file size metadata
        metadata_entries.append(MediaMetadata(
            media_file_id=media_file.id,
            key="file_size_bytes",
            value=str(len(file_content)),
            metadata_type="number"
        ))

        # Add content type metadata
        metadata_entries.append(MediaMetadata(
            media_file_id=media_file.id,
            key="content_type",
            value=file.content_type,
            metadata_type="string"
        ))

        # Add original filename metadata
        metadata_entries.append(MediaMetadata(
            media_file_id=media_file.id,
            key="original_filename",
            value=file.filename,
            metadata_type="string"
        ))

        for metadata in metadata_entries:
            session.add(metadata)

        await session.commit()

        # Reload with eager loading to access relationship
        query = select(MediaFile).where(MediaFile.id == media_file.id).options(selectinload(MediaFile.file_metadata))
        result = await session.execute(query)
        media_file = result.scalar_one()

        # Generate download URL
        download_url = await azure_storage.get_file_url(unique_filename)

        return UploadResponse(
            media_file=MediaFileSchema.from_orm(media_file),
            download_url=download_url
        )

    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.get("/", response_model=List[MediaFileList])
async def list_files(
    uploaded_by: Optional[str] = Query(None, description="Filter by uploader email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    session: AsyncSession = Depends(get_session)
):
    """List media files with optional filtering."""
    try:
        query = select(MediaFile)

        if uploaded_by:
            query = query.where(MediaFile.uploaded_by == uploaded_by)

        query = query.offset(skip).limit(limit).order_by(MediaFile.uploaded_at.desc())

        result = await session.execute(query)
        files = result.scalars().all()

        return [MediaFileList.from_orm(file) for file in files]

    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail="Failed to list files")

@router.get("/{file_id}", response_model=MediaFileSchema)
async def get_file(
    file_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get detailed information about a specific file."""
    try:
        query = select(MediaFile).where(MediaFile.id == file_id).options(selectinload(MediaFile.file_metadata))
        result = await session.execute(query)
        file = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        return MediaFileSchema.from_orm(file)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get file information")

@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Download a file from Azure Blob Storage."""
    try:
        # Get file metadata
        query = select(MediaFile).where(MediaFile.id == file_id)
        result = await session.execute(query)
        file = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Download from Azure
        file_content = await azure_storage.download_file(file.filename)

        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=file.content_type,
            headers={"Content-Disposition": f"attachment; filename={file.original_filename}"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to download file")

@router.get("/{file_id}/url")
async def get_file_url(
    file_id: int,
    expiry_hours: int = Query(24, ge=1, le=168, description="URL expiry in hours (1-168)"),
    session: AsyncSession = Depends(get_session)
):
    """Get a signed URL for direct access to the file."""
    try:
        # Get file metadata
        query = select(MediaFile).where(MediaFile.id == file_id)
        result = await session.execute(query)
        file = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Generate signed URL
        signed_url = await azure_storage.get_file_url(file.filename, expiry_hours)

        return {"download_url": signed_url, "expires_in_hours": expiry_hours}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating URL for file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate download URL")

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Delete a file from both database and Azure Blob Storage."""
    try:
        # Get file metadata
        query = select(MediaFile).where(MediaFile.id == file_id)
        result = await session.execute(query)
        file = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Delete from Azure Blob Storage
        await azure_storage.delete_file(file.filename)

        # Delete from database (cascade will handle metadata)
        await session.delete(file)
        await session.commit()

        return {"message": "File deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete file")

@router.put("/{file_id}", response_model=MediaFileSchema)
async def update_file(
    file_id: int,
    update_data: MediaFileUpdate,
    session: AsyncSession = Depends(get_session)
):
    """Update file metadata."""
    try:
        # Get file
        query = select(MediaFile).where(MediaFile.id == file_id)
        result = await session.execute(query)
        file = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        # Update fields
        if update_data.original_filename:
            file.original_filename = update_data.original_filename

        # Update metadata if provided
        if update_data.metadata:
            # Remove existing metadata
            await session.execute(
                select(MediaMetadata).where(MediaMetadata.media_file_id == file_id).delete()
            )

            # Add new metadata
            for metadata_data in update_data.metadata:
                metadata = MediaMetadata(
                    media_file_id=file_id,
                    key=metadata_data.key,
                    value=metadata_data.value,
                    metadata_type=metadata_data.metadata_type
                )
                session.add(metadata)

        await session.commit()
        
        # Reload with eager loading
        query = select(MediaFile).where(MediaFile.id == file_id).options(selectinload(MediaFile.file_metadata))
        result = await session.execute(query)
        file = result.scalar_one()

        return MediaFileSchema.from_orm(file)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating file {file_id}: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail="Failed to update file")


@router.post("/batch", response_model=List[dict])
async def get_media_batch(
    request: BatchMediaRequest,
    session: AsyncSession = Depends(get_session)
):
    """Get multiple media files by their IDs."""
    if not request.media_file_ids:
        return []

    # Query for media files
    query = (
        select(MediaFile)
        .where(MediaFile.id.in_(request.media_file_ids))
        .options(selectinload(MediaFile.file_metadata))
    )
    result = await session.execute(query)
    files = result.scalars().all()

    # Convert to response format and add download URLs
    media_files = []
    for file in files:
        file_dict = {
            "id": file.id,
            "filename": file.filename,
            "original_filename": file.original_filename,
            "file_path": file.file_path,
            "file_size": file.file_size,
            "content_type": file.content_type,
            "uploaded_by": file.uploaded_by,
            "uploaded_at": file.uploaded_at.isoformat(),
            "container_name": file.container_name,
            "file_metadata": [
                {
                    "id": meta.id,
                    "media_file_id": meta.media_file_id,
                    "key": meta.key,
                    "value": meta.value,
                    "metadata_type": meta.metadata_type
                }
                for meta in file.file_metadata
            ]
        }

        # Add download URL - use longer expiry for images that might be cached
        try:
            expiry_hours = 168 if file.content_type and file.content_type.startswith('image/') else 24  # 7 days for images, 24 hours for others
            download_url = await azure_storage.get_file_url(file.filename, expiry_hours)
            file_dict["download_url"] = download_url
            logger.info(f"Generated download URL for file {file.id}: {download_url[:100]}...")
        except Exception as e:
            logger.warning(f"Failed to get download URL for file {file.id}: {e}")
            file_dict["download_url"] = None

        media_files.append(file_dict)

    return media_files


@router.get("/{file_id}/image")
async def get_image(
    file_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Serve an image file directly with proper CORS headers."""
    try:
        # Get file metadata
        query = select(MediaFile).where(MediaFile.id == file_id)
        result = await session.execute(query)
        file = result.scalar_one_or_none()

        if not file:
            raise HTTPException(status_code=404, detail="File not found")

        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File is not an image")

        # Stream the file from Azure
        file_data = await azure_storage.download_file(file.filename)

        return StreamingResponse(
            io.BytesIO(file_data),
            media_type=file.content_type,
            headers={
                "Content-Disposition": f"inline; filename={file.original_filename}",
                "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve image")
