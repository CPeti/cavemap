from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import groups, members, invitations, applications, caves
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
                print(f"connecting to {getattr(settings, 'db_url', '<unknown>')}")
                print(f"  Retrying in {wait_time:.1f}s... Error: {str(e)[:100]}")
                await asyncio.sleep(wait_time)
            else:
                print(f"✗ Failed to initialize database after {max_retries} attempts")
                raise
    yield

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

