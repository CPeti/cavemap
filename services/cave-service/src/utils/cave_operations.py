import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.models.cave import Cave, CaveMedia
from src.utils.rabbitmq_publisher import publisher

logger = logging.getLogger(__name__)




async def delete_cave_by_id(session: AsyncSession, cave_id: int) -> bool:
    """
    Delete a cave from the database and notify other services.

    Args:
        session: Database session
        cave_id: ID of the cave to delete

    Returns:
        bool: True if deletion was successful, False otherwise
    """
    # Get the cave with its media associations
    result = await session.execute(
        select(Cave).where(Cave.cave_id == cave_id)
    )
    cave = result.scalar_one_or_none()

    if not cave:
        logger.warning(f"Cave {cave_id} not found for deletion")
        return False

    cave_name = cave.name
    owner_email = cave.owner_email

    # Collect media file IDs before deleting the cave
    media_file_ids = []
    media_result = await session.execute(
        select(CaveMedia.media_file_id).where(CaveMedia.cave_id == cave_id)
    )
    for row in media_result:
        media_file_ids.append(row[0])

    try:
        # Delete the cave (entrances and media associations will be cascade deleted)
        await session.delete(cave)
        await session.commit()

        logger.info(f"Successfully deleted cave {cave_id} ({cave_name}) from database")

        # Publish RabbitMQ message to notify other services (including group service to clean up assignments and media service to delete files)
        try:
            await publisher.publish_cave_deleted(cave_id, cave_name, owner_email, media_file_ids)
            logger.info(f"Successfully published cave deletion event for cave {cave_id} with {len(media_file_ids)} associated media files")
        except Exception as e:
            logger.error(f"Failed to publish cave deletion event for cave {cave_id}: {e}")
            # Don't fail the whole operation if RabbitMQ fails

        return True

    except Exception as e:
        logger.error(f"Error deleting cave {cave_id}: {e}")
        await session.rollback()
        return False

        return True

    except Exception as e:
        logger.error(f"Error deleting cave {cave_id}: {e}")
        await session.rollback()
        return False
