from fastapi import APIRouter, HTTPException
import httpx
from jose import jwt
from datetime import datetime, timedelta

from config import settings
from schemas.schemas import GitHubLoginRequest, TokenResponse
from seed_data import DEMO_USER

router = APIRouter(tags=["auth"])

GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


@router.post("/github", response_model=TokenResponse)
async def github_login(payload: GitHubLoginRequest):
    """Exchange GitHub OAuth code for access token and return JWT."""
    # Exchange code for GitHub access token
    print(f"DEBUG: exchanging code {payload.code} with ID {settings.github_client_id}...")
    async with httpx.AsyncClient() as client:
        res = await client.post(
            GITHUB_TOKEN_URL,
            json={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": payload.code,
            },
            headers={"Accept": "application/json"},
        )

    token_data = res.json()
    print(f"DEBUG: GitHub response: {token_data}")
    gh_token = token_data.get("access_token")
    if not gh_token:
        print(f"ERROR: No access_token found in {token_data}")
        raise HTTPException(status_code=400, detail=f"GitHub Error: {token_data.get('error_description', 'Unknown error')}")

    # Fetch user profile
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"token {gh_token}"},
        )

    user_data = user_res.json()
    user = {
        "name": user_data.get("name", user_data.get("login")),
        "username": user_data.get("login"),
        "avatar": user_data.get("avatar_url", ""),
        "github_token": gh_token,
        "target_role": "Full Stack Developer",  # Default for new users
    }

    token = _create_jwt(user)
    return TokenResponse(access_token=token, user=user)


@router.get("/me")
async def get_current_user():
    """Return current user info."""
    raise HTTPException(status_code=401, detail="Not authenticated")


def _create_jwt(user: dict) -> str:
    """Create a signed JWT token."""
    payload = {
        "sub": user.get("username", "demo"),
        "name": user.get("name", "Demo User"),
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
