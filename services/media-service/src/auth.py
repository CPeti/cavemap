"""
Authentication dependencies for FastAPI endpoints.

Auth is verified by calling the OAuth2 proxy's /oauth2/auth endpoint
with the user's cookies. This allows per-endpoint auth control.
"""

from fastapi import Request, HTTPException, status
from typing import Optional
import httpx
import os
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging

logger = logging.getLogger(__name__)

# OAuth2 proxy internal service URL (within the cluster)
OAUTH2_PROXY_AUTH_URL = "http://oauth2-proxy.default.svc.cluster.local:4180/oauth2/auth"

# Service authentication token for internal service-to-service communication
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "dev-service-token-123")


class User:
    """Represents an authenticated user."""
    def __init__(self, email: str, user: Optional[str] = None, access_token: Optional[str] = None):
        self.email = email
        self.user = user or email
        self.access_token = access_token

    def __repr__(self):
        return f"User(email={self.email})"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError)),
)
async def _verify_oauth2_auth(cookies: str, headers: dict) -> Optional[User]:
    """Verify OAuth2 authentication with retries."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            OAUTH2_PROXY_AUTH_URL,
            headers=headers,
            timeout=5.0
        )

        if response.status_code == 202 or response.status_code == 200:
            # User is authenticated - extract user info from response headers
            email = response.headers.get("X-Auth-Request-Email", "")
            user = response.headers.get("X-Auth-Request-User", "")
            access_token = response.headers.get("X-Auth-Request-Access-Token")

            if email:
                return User(email=email, user=user, access_token=access_token)

        return None


async def verify_auth(request: Request) -> Optional[User]:
    """
    Verify authentication by checking service token or calling OAuth2 proxy.
    Returns User if authenticated, None otherwise.
    """
    # Check for service token first (internal service communication)
    service_token = request.headers.get("X-Service-Token")
    if service_token and service_token == SERVICE_TOKEN:
        # Service-to-service call - create a service user
        return User(email="service@cavemap.internal", user="service")

    # Get cookies from the request to forward to OAuth2 proxy
    cookies = request.headers.get("cookie", "")
    if not cookies:
        return None

    headers = {
        "Cookie": cookies,
        "X-Forwarded-Proto": request.headers.get("x-forwarded-proto", "https"),
        "X-Forwarded-Host": request.headers.get("x-forwarded-host", request.headers.get("host", "")),
        "X-Forwarded-Uri": str(request.url.path),
    }

    try:
        return await _verify_oauth2_auth(cookies, headers)
    except Exception as e:
        # Log error but don't fail - treat as unauthenticated
        logger.warning(f"Auth verification error after retries: {e}")
        return None


async def get_current_user(request: Request) -> Optional[User]:
    """
    Dependency that returns the current user if authenticated, None otherwise.
    Use this for endpoints that work with or without auth.

    Usage:
        @router.get("/")
        async def endpoint(user: Optional[User] = Depends(get_current_user)):
            if user:
                # User is logged in
            else:
                # Anonymous access
    """
    return await verify_auth(request)


async def require_auth(request: Request) -> User:
    """
    Dependency that requires authentication.
    Returns 401 if user is not authenticated.

    Usage:
        @router.post("/")
        async def protected_endpoint(user: User = Depends(require_auth)):
            # Only authenticated users can access
    """
    user = await verify_auth(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


async def require_internal_service(request: Request) -> User:
    """
    Dependency that requires service token authentication.
    Only allows internal service-to-service communication.
    Returns 401 if service token is not provided or invalid.

    Usage:
        @router.get("/internal")
        async def internal_endpoint(user: User = Depends(require_internal_service)):
            # Only internal services can access
    """
    service_token = request.headers.get("X-Service-Token")
    if not service_token or service_token != SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Service token required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Return service user
    return User(email="service@cavemap.internal", user="service")
