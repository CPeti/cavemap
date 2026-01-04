"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2024-01-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create caves table
    op.create_table('caves',
        sa.Column('cave_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('zone', sa.String(), nullable=True),
        sa.Column('code', sa.String(), nullable=True),
        sa.Column('first_surveyed', sa.String(), nullable=True),
        sa.Column('last_surveyed', sa.String(), nullable=True),
        sa.Column('length', sa.Float(), nullable=True),
        sa.Column('depth', sa.Float(), nullable=True),
        sa.Column('vertical_extent', sa.Float(), nullable=True),
        sa.Column('horizontal_extent', sa.Float(), nullable=True),
        sa.Column('owner_email', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('cave_id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_caves_cave_id'), 'caves', ['cave_id'], unique=False)

    # Create entrances table
    op.create_table('entrances',
        sa.Column('entrance_id', sa.Integer(), nullable=False),
        sa.Column('cave_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('gps_n', sa.Float(), nullable=False),
        sa.Column('gps_e', sa.Float(), nullable=False),
        sa.Column('asl_m', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['cave_id'], ['caves.cave_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('entrance_id')
    )
    op.create_index(op.f('ix_entrances_entrance_id'), 'entrances', ['entrance_id'], unique=False)

    # Create cave_media table
    op.create_table('cave_media',
        sa.Column('cave_id', sa.Integer(), nullable=False),
        sa.Column('media_file_id', sa.Integer(), nullable=False),
        sa.Column('added_by', sa.String(), nullable=False),
        sa.Column('added_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['cave_id'], ['caves.cave_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('cave_id', 'media_file_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order to handle foreign key constraints
    op.drop_table('cave_media')
    op.drop_table('entrances')
    op.drop_table('caves')
