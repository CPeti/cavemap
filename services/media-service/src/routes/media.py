import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, Response, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import io
import httpx
import os
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

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
from src.auth import User, require_auth
from pydantic import BaseModel


class BatchMediaRequest(BaseModel):
    media_file_ids: List[int]
from src.utils.azure_storage import azure_storage
from src.config.settings import settings

# Group service URL
GROUP_SERVICE_URL = os.getenv("GROUP_SERVICE_URL", "http://group-service.default.svc.cluster.local")

# Cave service URL
CAVE_SERVICE_URL = os.getenv("CAVE_SERVICE_URL", "http://cave-service.default.svc.cluster.local")

# User service URL
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service.default.svc.cluster.local")

# Service authentication token for internal service-to-service communication
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "dev-service-token-123")

logger = logging.getLogger(__name__)

router = APIRouter()

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError)),
)
async def _check_cave_permissions_with_retry(cave_id: int, user_email: str) -> bool:
    """Check cave edit permissions with cave ownership and group permissions with retries."""

    # First check if user is the cave owner
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CAVE_SERVICE_URL}/caves/{cave_id}/permissions/{user_email}",
            headers={"X-Service-Token": SERVICE_TOKEN},
            timeout=5.0
        )

        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("can_edit", False):
                    return True  # User is the cave owner
            except Exception as e:
                logger.warning(f"Failed to parse cave service response: {e}")

    # If not the owner, check group permissions
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GROUP_SERVICE_URL}/groups/{cave_id}/permissions/{user_email}",
            headers={"X-Service-Token": SERVICE_TOKEN},
            timeout=5.0
        )

        if response.status_code == 200:
            try:
                data = response.json()
                return data.get("can_edit", False)
            except Exception as e:
                logger.warning(f"Failed to parse group service response: {e}")
                return False

        logger.warning(f"Group service returned status {response.status_code} for cave {cave_id}, user {user_email}")
        return False


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError)),
)
async def _notify_cave_service_with_retry(cave_id: int, media_file_id: int):
    """Notify cave service that media was added with retries."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CAVE_SERVICE_URL}/caves/{cave_id}/media/{media_file_id}/internal",
            headers={"X-Service-Token": SERVICE_TOKEN},
            timeout=5.0
        )
        print(f"Cave service response: {response.json()}")
        response.raise_for_status()
        
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError)),
)
async def _fetch_usernames_with_retry(emails: list[str]) -> dict[str, str]:
    """Fetch usernames from user-service with retries."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{USER_SERVICE_URL}/users/lookup",
            json={"emails": emails},
            timeout=5.0
        )
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Failed to fetch usernames: {response.status_code}")
            return {}

async def fetch_usernames(emails: list[str]) -> dict[str, str]:
    """Fetch usernames from user-service for given emails."""
    if not emails:
        return {}
    logger.info(f"fetching usernames for {emails}")
    try:
        return await _fetch_usernames_with_retry(emails)
    except Exception as e:
        logger.error(f"Error fetching usernames after retries: {e}")
        return {}


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    cave_id: int = Form(..., description="ID of the cave to associate the file with"),
    user: User = Depends(require_auth),
    session: AsyncSession = Depends(get_session)
):
    """Upload a file to Azure Blob Storage and store metadata in database."""
    try:
        print(f"Upload request: cave_id={cave_id}, file={file.filename}")

        # Check if user has permission to edit the cave
        try:
            can_edit = await _check_cave_permissions_with_retry(cave_id, user.email)
            logger.info(f"Permission check result for cave {cave_id}, user {user.email}: {can_edit}")
            if not can_edit:
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to upload files to this cave"
                )
        except Exception as e:
            logger.error(f"Error checking cave permissions: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to verify cave permissions"
            )

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
        
        usernames_map = await fetch_usernames([user.email])
        

        # Create database record
        media_file = MediaFile(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=blob_url,
            file_size=len(file_content),
            content_type=file.content_type,
            uploaded_by=usernames_map.get(user.email, user.email.split('@')[0]),
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

        # Notify cave service that file was added
        try:
            await _notify_cave_service_with_retry(cave_id, media_file.id)
            print(f"Successfully notified cave service about media file {media_file.id} for cave {cave_id}")
        except Exception as e:
            print(f"Failed to notify cave service about media file {media_file.id} for cave {cave_id}: {e}")
            # Don't fail the upload if cave service notification fails
            # The file is still uploaded and stored, just not associated with the cave yet

        return UploadResponse(
            media_file=MediaFileSchema.from_orm(media_file),
            download_url=download_url
        )

    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

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
