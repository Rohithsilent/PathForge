from fastapi import APIRouter, HTTPException
import httpx
from jose import jwt
from datetime import datetime, timedelta
import os

from config import settings
from schemas.schemas import GitHubLoginRequest, FirebaseLoginRequest, TokenResponse
from seed_data import DEMO_USER

router = APIRouter(tags=["auth"])

GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

# --- Firebase Admin init (lazy, only when credentials are provided) ---
_firebase_initialized = False

def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    creds_path = settings.firebase_credentials_path
    try:
        import firebase_admin
        from firebase_admin import credentials
        if not firebase_admin._apps:
            if creds_path and os.path.isfile(creds_path):
                cred = credentials.Certificate(creds_path)
                firebase_admin.initialize_app(cred)
            else:
                # Initialize without credentials — token verification will be done via Google public keys
                firebase_admin.initialize_app()
        _firebase_initialized = True
    except Exception as e:
        print(f"WARNING: Firebase init failed: {e}. Firebase auth will use dev-mode fallback.")


@router.post("/github", response_model=TokenResponse)
async def github_login(payload: GitHubLoginRequest):
    """Exchange GitHub OAuth code for access token and return JWT."""
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
        "target_role": "Full Stack Developer",
        "auth_provider": "github",
    }

    token = _create_jwt(user)
    return TokenResponse(access_token=token, user=user)


@router.post("/firebase", response_model=TokenResponse)
async def firebase_login(payload: FirebaseLoginRequest):
    """
    Verify a Firebase ID token (from Google Sign-In) and return a PathForge JWT.
    If Firebase credentials are not configured, falls back to decoding the token
    payload from Google's tokeninfo endpoint (dev/demo mode).
    """
    _init_firebase()

    firebase_user = None

    # Try Firebase Admin SDK first
    try:
        from firebase_admin import auth as firebase_auth
        decoded = firebase_auth.verify_id_token(payload.id_token)
        firebase_user = {
            "uid": decoded.get("uid"),
            "email": decoded.get("email", ""),
            "name": decoded.get("name", decoded.get("email", "User")),
            "avatar": decoded.get("picture", ""),
        }
    except Exception as e:
        print(f"Firebase Admin verify failed: {e}. Trying Google tokeninfo fallback...")
        # Fallback: call Google tokeninfo endpoint (works in dev without service account)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.id_token}"
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Firebase ID token.")
        data = resp.json()
        if "error" in data:
            raise HTTPException(status_code=401, detail=f"Token error: {data.get('error_description', data['error'])}")
        firebase_user = {
            "uid": data.get("sub"),
            "email": data.get("email", ""),
            "name": data.get("name", data.get("email", "User")),
            "avatar": data.get("picture", ""),
        }

    # Check if user already exists
    uid = firebase_user["uid"]
    from services import user_service
    existing_profile = user_service.get_user_profile(uid)

    if existing_profile:
        # Returning user — restore connected accounts and onboarding status
        onboarding_done = bool(
            existing_profile.get("onboarding_completed") or
            existing_profile.get("github_connected") or
            existing_profile.get("linkedin_connected")
        )
        user = {
            **existing_profile,
            "uid": uid,
            "username": uid,
            "name": firebase_user["name"] or existing_profile.get("name", "User"),
            "email": firebase_user["email"] or existing_profile.get("email", ""),
            "avatar": firebase_user["avatar"] or existing_profile.get("avatar", ""),
            "auth_provider": "google",
            "onboarding_completed": onboarding_done,
        }
        user_service.save_user_profile(uid, user)
    else:
        # New user — needs onboarding
        email = firebase_user.get("email", "")
        guessed_github = email.split("@")[0] if email else ""
        user = {
            "uid": uid,
            "username": uid,
            "name": firebase_user["name"],
            "email": email,
            "avatar": firebase_user["avatar"],
            "target_role": "Full Stack Developer",
            "auth_provider": "google",
            "github_username_hint": guessed_github,
            "github_connected": False,
            "linkedin_connected": False,
            "onboarding_completed": False,
        }
        user_service.save_user_profile(uid, user)

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
        "email": user.get("email", ""),
        "avatar": user.get("avatar", ""),
        "auth_provider": user.get("auth_provider", "unknown"),
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
