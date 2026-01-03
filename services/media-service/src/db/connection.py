from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from src.models.base import Base
from src.config.settings import settings

assert settings.db_url is not None, "Database URL (settings.db_url) must be set"

engine = create_async_engine(settings.db_url, echo=True)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_session():
    async with async_session() as session:
        yield session

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
