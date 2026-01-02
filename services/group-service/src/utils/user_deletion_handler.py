from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
from src.models.group import Group, GroupMember, GroupCave, MemberRole
from src.db.connection import async_session
import logging

logger = logging.getLogger(__name__)

class UserDeletionHandler:

    async def handle_user_deletion(self, user_email: str, user_id: str = None):
        """
        Handle user deletion by managing group ownership transfers and deletions.

        Args:
            user_email: Email of the deleted user
            user_id: ID of the deleted user (optional, for future use)
        """
        async with async_session() as db:
            try:
                logger.info(f"Handling user deletion for: {user_email}")

                # Find all groups where the user is the owner
                stmt = select(Group).join(GroupMember).where(
                    and_(
                        GroupMember.user_email == user_email,
                        GroupMember.role == MemberRole.OWNER,
                        Group.is_active == True
                    )
                )
                result = await db.execute(stmt)
                owned_groups = result.scalars().all()

                logger.info(f"Found {len(owned_groups)} groups owned by {user_email}")

                for group in owned_groups:
                    await self._handle_group_ownership_transfer(db, group, user_email)

                # Remove the user from all group memberships (including ones where they weren't owner)
                stmt = select(GroupMember).where(GroupMember.user_email == user_email)
                result = await db.execute(stmt)
                memberships_to_delete = result.scalars().all()

                for membership in memberships_to_delete:
                    await db.delete(membership)

                logger.info(f"Removed user {user_email} from {len(memberships_to_delete)} group memberships")

                # Update cave assignments where this user was the one who assigned them
                stmt = select(GroupCave).where(GroupCave.assigned_by == user_email)
                result = await db.execute(stmt)
                assignments_to_update = result.scalars().all()

                for assignment in assignments_to_update:
                    assignment.assigned_by = "system@cavemap.internal"

                logger.info(f"Updated {len(assignments_to_update)} cave assignments from {user_email} to system@cavemap.internal")

                await db.commit()
                logger.info(f"Successfully handled user deletion for {user_email}")

            except Exception as e:
                logger.error(f"Error handling user deletion for {user_email}: {e}")
                await db.rollback()
                raise

    async def _handle_group_ownership_transfer(self, db: AsyncSession, group: Group, old_owner_email: str):
        """
        Transfer ownership of a group to another member or delete the group if no members left.

        Priority order for new owner:
        1. Another admin
        2. Any member
        3. Delete group if no other members
        """
        try:
            logger.info(f"Transferring ownership of group '{group.name}' (ID: {group.group_id}) from {old_owner_email}")

            # Get all other members of the group (excluding the deleted owner)
            stmt = select(GroupMember).where(
                and_(
                    GroupMember.group_id == group.group_id,
                    GroupMember.user_email != old_owner_email
                )
            ).order_by(GroupMember.joined_at)
            result = await db.execute(stmt)
            other_members = result.scalars().all()

            if not other_members:
                # No other members - delete the group
                logger.info(f"No other members in group '{group.name}' - deleting group")
                await db.delete(group)
                logger.info(f"Deleted group '{group.name}' (ID: {group.group_id})")
                return

            # Find the best candidate for new owner
            new_owner = None

            # Priority 1: Another admin
            for member in other_members:
                if member.role == MemberRole.ADMIN:
                    new_owner = member
                    break

            # Priority 2: Any member (first joined gets preference)
            if not new_owner:
                new_owner = other_members[0]

            # Transfer ownership
            new_owner.role = MemberRole.OWNER
            logger.info(f"Transferred ownership of group '{group.name}' to {new_owner.user_email} (role was {new_owner.role})")

            # If the new owner was a member, we might want to promote another admin
            # But for now, keep it simple - just transfer ownership

        except Exception as e:
            logger.error(f"Error transferring ownership of group '{group.name}': {e}")
            raise
