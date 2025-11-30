from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import caves
from src.db.connection import init_db
import asyncio

from contextlib import asynccontextmanager
from src.config.settings import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    max_retries = 10
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            await init_db()
            print("✓ Database initialized successfully")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = retry_delay * (1.5 ** attempt)
                print(f"⚠ Database connection failed (attempt {attempt + 1}/{max_retries})")
                print(f"connecting to {getattr(settings, 'database_url', '<unknown>')}")
                print(f"  Retrying in {wait_time:.1f}s... Error: {str(e)[:100]}")
                await asyncio.sleep(wait_time)
            else:
                print(f"✗ Failed to initialize database after {max_retries} attempts")
                raise
    yield

app = FastAPI(
    title="Cave Database API", 
    lifespan=lifespan,
    description="API for managing cave and entrance data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(caves.router, prefix="/caves", tags=["Caves"])


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






