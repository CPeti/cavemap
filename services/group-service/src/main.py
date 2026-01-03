from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import groups, members, invitations, applications, caves
from src.db.connection import init_db
from src.utils.rabbitmq_consumer import start_rabbitmq_consumer, stop_rabbitmq_consumer
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_with_retry()

    # Start RabbitMQ consumer
    try:
        await start_rabbitmq_consumer()
        print("✓ RabbitMQ consumer started successfully")
    except Exception as e:
        print(f"⚠ Failed to start RabbitMQ consumer: {str(e)[:100]}")
        # Don't fail startup if RabbitMQ is not available

    yield

    # Stop RabbitMQ consumer on shutdown
    try:
        await stop_rabbitmq_consumer()
        print("✓ RabbitMQ consumer stopped successfully")
    except Exception as e:
        print(f"⚠ Error stopping RabbitMQ consumer: {str(e)[:100]}")

app = FastAPI(
    title="Group Service API", 
    lifespan=lifespan,
    description="API for managing expedition groups, members, invitations, and cave assignments",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check for debugging
@app.get("/health")
def root_health():
    return {"status": "ok", "service": "group-service"}

# Group management routes
# IMPORTANT: Register routers with specific paths BEFORE catch-all {group_id} routes
# to avoid path conflicts (e.g., /invitations/me vs /{group_id})
app.include_router(invitations.router, prefix="/groups", tags=["Invitations"])
app.include_router(applications.router, prefix="/groups", tags=["Applications"])
app.include_router(members.router, prefix="/groups", tags=["Members"])
app.include_router(caves.router, prefix="/groups", tags=["Cave Assignments"])
app.include_router(groups.router, prefix="/groups", tags=["Groups"])


if __name__ == "__main__":
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="Run the FastAPI application.")
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

