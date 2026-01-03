import httpx
import logging
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.db.connection import async_session
from src.models.cave import Cave
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

# Group service URL
GROUP_SERVICE_URL = os.getenv("GROUP_SERVICE_URL", "http://group-service.default.svc.cluster.local")

# Service authentication token for internal service-to-service communication
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "dev-service-token-123")


class CaveDeletionHandler:
    """Handles cave ownership management when users are deleted"""

    async def handle_user_deletion(self, user_email: str, user_id: str = None) -> None:
        """
        Handle user deletion by managing cave ownership inheritance.

        Args:
            user_email: Email of the deleted user
            user_id: User ID of the deleted user (optional)
        """
        logger.info(f"Processing user deletion for {user_email}")
        
        async with async_session() as session:
            # Find all caves owned by this user
            result = await session.execute(
                select(Cave).where(Cave.owner_email == user_email)
            )
            caves = result.scalars().all()
            
            if not caves:
                logger.info(f"No caves found owned by {user_email}")
                return
            
            logger.info(f"Found {len(caves)} caves owned by {user_email}")
            
            for cave in caves:
                await self._handle_cave_inheritance(session, cave, user_email)
    
    async def _handle_cave_inheritance(self, session: AsyncSession, cave: Cave, user_email: str) -> None:
        """
        Handle inheritance for a single cave by querying group service.
        
        Args:
            session: Database session
            cave: The cave to handle
            user_email: Email of the deleted user
        """
        cave_id = cave.cave_id
        
        try:
            # Query group service for inheritance info
            response = await _query_inheritance_with_retry(cave_id, user_email)

            if response.status_code != 200:
                logger.error(f"Failed to get inheritance info for cave {cave_id}: {response.status_code}")
                return

            inheritance_data = response.json()
            action = inheritance_data.get("action")
            inherit_email = inheritance_data.get("inherit_email")

            logger.info(f"Cave {cave_id}: action={action}, inherit_email={inherit_email}")

            if action == "transfer" and inherit_email:
                # Transfer ownership to the inherited user
                cave.owner_email = inherit_email
                await session.commit()
                logger.info(f"Transferred cave {cave_id} ownership to {inherit_email}")

            elif action == "delete":
                # Delete the cave
                await session.delete(cave)
                await session.commit()
                logger.info(f"Deleted cave {cave_id} (no inheritance candidate)")

                # Clean up group assignments
                await self._delete_cave_assignments(cave_id)
                    
        except Exception as e:
            logger.error(f"Error handling inheritance for cave {cave_id}: {e}")
    
    async def _delete_cave_assignments(self, cave_id: int) -> None:
        """
        Clean up cave assignments in group service.
        
        Args:
            cave_id: ID of the cave to clean up
        """
        try:
            response = await _delete_assignments_with_retry(cave_id)

            if response.status_code == 204:
                logger.info(f"Cleaned up assignments for cave {cave_id}")
            else:
                logger.warning(f"Failed to clean up assignments for cave {cave_id}: {response.status_code}")

        except Exception as e:
            logger.error(f"Error cleaning up assignments for cave {cave_id}: {e}")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError)),
)
async def _query_inheritance_with_retry(cave_id: int, user_email: str):
    """Query group service for inheritance info with retries."""
    async with httpx.AsyncClient() as client:
        return await client.get(
            f"{GROUP_SERVICE_URL}/groups/caves/{cave_id}/inheritance",
            params={"current_owner_email": user_email},
            headers={"X-Service-Token": SERVICE_TOKEN}
        )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError)),
)
async def _delete_assignments_with_retry(cave_id: int):
    """Delete cave assignments with retries."""
    async with httpx.AsyncClient() as client:
        return await client.delete(
            f"{GROUP_SERVICE_URL}/caves/{cave_id}/assignments",
            headers={"X-Service-Token": SERVICE_TOKEN}
        )