import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from src.db.connection import async_session
from src.models.media import MediaFile
from src.utils.azure_storage import azure_storage

logger = logging.getLogger(__name__)


class CaveDeletionHandler:
    """Handles cave deletion events by cleaning up associated media files"""

    async def handle_cave_deletion(self, cave_id: int, cave_name: str, owner_email: str, media_file_ids: List[int]) -> None:
        """
        Handle cave deletion by removing all associated media files.

        Args:
            cave_id: ID of the deleted cave
            cave_name: Name of the deleted cave
            owner_email: Email of the cave owner
            media_file_ids: List of media file IDs associated with the cave
        """
        logger.info(f"Processing cave deletion for cave {cave_id} ({cave_name}) owned by {owner_email}")
        print(f"Processing cave deletion for cave {cave_id} ({cave_name}) owned by {owner_email}")
        logger.info(f"Found {len(media_file_ids)} media files to delete")
        print(f"Found {len(media_file_ids)} media files to delete")

        if not media_file_ids:
            logger.info(f"No media files associated with cave {cave_id}")
            return

        async with async_session() as session:
            try:
                deleted_files = 0
                deleted_blobs = 0

                for media_file_id in media_file_ids:
                    try:
                        # Get the media file
                        result = await session.execute(
                            select(MediaFile).where(MediaFile.id == media_file_id)
                        )
                        media_file = result.scalar_one_or_none()

                        if not media_file:
                            logger.warning(f"Media file {media_file_id} not found in database")
                            continue

                        # Delete from Azure Blob Storage
                        try:
                            deleted = await azure_storage.delete_file(media_file.filename)
                            if deleted:
                                deleted_blobs += 1
                                logger.info(f"Deleted blob for media file {media_file.filename}")
                            else:
                                logger.warning(f"Blob not found for media file {media_file.filename}, skipping deletion")
                        except Exception as e:
                            logger.error(f"Failed to delete blob for media file {media_file.filename}: {e}")
                            # Continue with database deletion even if blob deletion fails

                        # Delete from database (this will cascade delete metadata)
                        await session.delete(media_file)
                        deleted_files += 1
                        logger.info(f"Deleted media file {media_file.filename} from database")

                    except Exception as e:
                        logger.error(f"Error deleting media file {media_file_id}: {e}")
                        # Continue with other files

                await session.commit()

                logger.info(f"Successfully deleted {deleted_files} media files from database and {deleted_blobs} blobs from storage for cave {cave_id}")

            except Exception as e:
                logger.error(f"Error processing cave deletion for cave {cave_id}: {e}")
                await session.rollback()
                raise
