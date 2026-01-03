from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import media
from src.db.connection import init_db
from src.utils.azure_storage import azure_storage
import asyncio

from contextlib import asynccontextmanager
from src.config.settings import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, before_sleep_log
import logging

logger = logging.getLogger(__name__)

@retry(
    stop=stop_after_attempt(10),
    wait=wait_exponential(multiplier=2, min=2, max=60),
    retry=retry_if_exception_type(Exception),
    before_sleep=before_sleep_log(logger, logging.WARNING)
)
async def init_db_with_retry():
    """Initialize database with automatic retries using tenacity."""
    try:
        await init_db()
        print("✓ Database initialized successfully")
    except Exception as e:
        print(f"⚠ Database connection failed: {str(e)[:100]}")
        print(f"connecting to {getattr(settings, 'db_url', '<unknown>')}")
        raise  # Re-raise to let tenacity handle the retry

async def init_azure_storage():
    """Initialize Azure Blob Storage connection."""
    try:
        # The azure_storage instance will be created and container checked
        print("✓ Azure Blob Storage initialized successfully")
    except Exception as e:
        print(f"⚠ Azure Blob Storage initialization failed: {str(e)[:100]}")
        raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_with_retry()
    await init_azure_storage()

    yield

    print("✓ Application shutdown complete")

app = FastAPI(
    title="Media Service API",
    lifespan=lifespan,
    description="API for managing media files in Azure Blob Storage",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media.router, prefix="/media", tags=["Media"])


if __name__ == "__main__":
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="Run the Media Service FastAPI application.")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    args = parser.parse_args()

    uvicorn.run(
        "src.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )
