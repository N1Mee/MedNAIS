"""
JWT Authentication utilities for FastAPI backend
"""
import os
import jwt
import logging
from typing import Optional
from fastapi import HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

if not JWT_SECRET:
    logger.warning("JWT_SECRET not found in environment variables - JWT verification will fail")


class UserContext(BaseModel):
    """User context extracted from JWT token"""
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = "user"


def verify_jwt_token(token: str) -> UserContext:
    """
    Verify JWT token and extract user context
    
    Args:
        token: JWT token string (without "Bearer " prefix)
        
    Returns:
        UserContext: Extracted user information
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    if not JWT_SECRET:
        raise HTTPException(
            status_code=500, 
            detail="JWT_SECRET not configured"
        )
    
    try:
        # Decode and verify token
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        
        # Extract user information from payload
        user_id = payload.get("sub") or payload.get("user_id") or payload.get("userId")
        
        if not user_id:
            raise HTTPException(
                status_code=401, 
                detail="Invalid token: missing user identifier"
            )
        
        return UserContext(
            user_id=user_id,
            email=payload.get("email"),
            name=payload.get("name"),
            role=payload.get("role", "user")
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401, 
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401, 
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error verifying JWT token: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Authentication failed"
        )


def get_user_from_auth_header(authorization: Optional[str] = None) -> UserContext:
    """
    Extract and verify user from Authorization header
    
    Args:
        authorization: Authorization header value (e.g., "Bearer <token>")
        
    Returns:
        UserContext: Verified user information
        
    Raises:
        HTTPException: If authentication fails
    """
    if not authorization:
        raise HTTPException(
            status_code=401, 
            detail="Missing Authorization header"
        )
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401, 
            detail="Invalid Authorization header format. Expected: 'Bearer <token>'"
        )
    
    token = parts[1]
    return verify_jwt_token(token)


def get_optional_user_from_auth_header(authorization: Optional[str] = None) -> Optional[UserContext]:
    """
    Extract user from Authorization header if present, otherwise return None
    Useful for endpoints that work both authenticated and unauthenticated
    
    Args:
        authorization: Authorization header value (optional)
        
    Returns:
        UserContext or None: User information if authenticated, None otherwise
    """
    if not authorization:
        return None
    
    try:
        return get_user_from_auth_header(authorization)
    except HTTPException:
        # If authentication fails, return None for optional authentication
        return None


def require_admin(user: UserContext):
    """
    Check if user has admin role
    
    Args:
        user: User context to check
        
    Raises:
        HTTPException: If user is not an admin
    """
    if not user.role or user.role.lower() != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Admin access required"
        )


# FastAPI dependency for requiring authentication
async def get_current_user(authorization: Optional[str] = Header(None)) -> UserContext:
    """
    FastAPI dependency to get current authenticated user
    
    Usage:
        @router.get("/protected")
        async def protected_route(user: UserContext = Depends(get_current_user)):
            return {"user_id": user.user_id}
    """
    return get_user_from_auth_header(authorization)


# FastAPI dependency for optional authentication
async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[UserContext]:
    """
    FastAPI dependency for optional authentication
    
    Usage:
        @router.get("/public")
        async def public_route(user: Optional[UserContext] = Depends(get_optional_user)):
            if user:
                return {"authenticated": True, "user_id": user.user_id}
            return {"authenticated": False}
    """
    return get_optional_user_from_auth_header(authorization)


# FastAPI dependency for requiring admin access
async def require_admin_user(user: UserContext = Header(None)) -> UserContext:
    """
    FastAPI dependency to require admin authentication
    
    Usage:
        @router.post("/admin/action")
        async def admin_action(user: UserContext = Depends(require_admin_user)):
            return {"message": "Admin action completed"}
    """
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    require_admin(user)
    return user
