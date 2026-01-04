import logging
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from src.db.connection import async_session
from src.models.group import GroupCave

logger = logging.getLogger(__name__)


class CaveDeletionHandler:
    """Handles cave deletion events by cleaning up group assignments"""

    async def handle_cave_deletion(self, cave_id: int, cave_name: str, owner_email: str) -> None:
        """
        Handle cave deletion by removing all group assignments for the cave.

        Args:
            cave_id: ID of the deleted cave
            cave_name: Name of the deleted cave
            owner_email: Email of the cave owner
        """
        logger.info(f"Processing cave deletion for cave {cave_id} ({cave_name}) owned by {owner_email}")

        async with async_session() as session:
            try:
                # Find all assignments for this cave
                result = await session.execute(
                    select(GroupCave).where(GroupCave.cave_id == cave_id)
                )
                assignments = result.scalars().all()

                if not assignments:
                    logger.info(f"No group assignments found for cave {cave_id}")
                    return

                logger.info(f"Found {len(assignments)} group assignments for cave {cave_id}")

                # Delete all assignments for this cave
                delete_result = await session.execute(
                    delete(GroupCave).where(GroupCave.cave_id == cave_id)
                )

                await session.commit()

                logger.info(f"Successfully deleted {delete_result.rowcount} group assignments for cave {cave_id}")

            except Exception as e:
                logger.error(f"Error cleaning up assignments for cave {cave_id}: {e}")
                await session.rollback()
                raise
