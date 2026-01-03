"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2026-01-03 03:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create media_files table
    op.create_table('media_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('uploaded_by', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
        sa.Column('container_name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_media_files_filename'), 'media_files', ['filename'], unique=True)
    op.create_index(op.f('ix_media_files_id'), 'media_files', ['id'], unique=False)

    # Create media_metadata table
    op.create_table('media_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('media_file_id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('metadata_type', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['media_file_id'], ['media_files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_media_metadata_id'), 'media_metadata', ['id'], unique=False)
    op.create_index(op.f('ix_media_metadata_media_file_id'), 'media_metadata', ['media_file_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_media_metadata_media_file_id'), table_name='media_metadata')
    op.drop_index(op.f('ix_media_metadata_id'), table_name='media_metadata')
    op.drop_table('media_metadata')
    op.drop_index(op.f('ix_media_files_id'), table_name='media_files')
    op.drop_index(op.f('ix_media_files_filename'), table_name='media_files')
    op.drop_table('media_files')
