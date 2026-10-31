"""
User profile and connected accounts service.
Stores persistent user profiles in:
1. Local backend/data/users/{uid}.json
2. Firebase Auth custom user claims (for instant token verification)
3. Cloud Firestore (if Firestore API is enabled in Firebase Console)
"""
import os
import json
from typing import Dict, Any, Optional
from datetime import datetime

USERS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users")
os.makedirs(USERS_DIR, exist_ok=True)


def _get_user_file_path(uid: str) -> str:
    safe_uid = "".join(c for c in uid if c.isalnum() or c in ("-", "_"))
    return os.path.join(USERS_DIR, f"{safe_uid}.json")


def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
    """Retrieve user profile from local store or Firebase Auth."""
    if not uid:
        return None

    path = _get_user_file_path(uid)
    if os.path.isfile(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading user profile for {uid}: {e}")

    # Fallback to Firebase custom claims
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if firebase_admin._apps:
            user_record = fb_auth.get_user(uid)
            claims = user_record.custom_claims or {}
            if claims:
                profile = {
                    "uid": uid,
                    "email": user_record.email or "",
                    "name": user_record.display_name or "",
                    "avatar": user_record.photo_url or "",
                    "onboarding_completed": claims.get("onboarding_completed", False),
                    "github_username": claims.get("github_username", ""),
                    "github_connected": claims.get("github_connected", False),
                    "linkedin_connected": claims.get("linkedin_connected", False),
                    "linkedin_username": claims.get("linkedin_username", ""),
                    "target_role": claims.get("target_role", "Full Stack Developer"),
                }
                save_user_profile(uid, profile)
                return profile
    except Exception as e:
        print(f"Firebase claims fallback check error: {e}")

    return None


def save_user_profile(uid: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """Persist user profile to local storage, Firebase claims, and Firestore (if available)."""
    if not uid:
        return profile_data

    path = _get_user_file_path(uid)
    existing = get_user_profile(uid) or {}

    merged = {**existing, **profile_data, "uid": uid, "updated_at": datetime.utcnow().isoformat()}
    if "created_at" not in merged:
        merged["created_at"] = datetime.utcnow().isoformat()

    # 1. Save locally
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(merged, f, indent=2)
    except Exception as e:
        print(f"Error saving local profile for {uid}: {e}")

    # 2. Update Firebase Auth custom claims
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if firebase_admin._apps:
            claims = {
                "onboarding_completed": bool(merged.get("onboarding_completed")),
                "github_username": merged.get("github_username", ""),
                "github_connected": bool(merged.get("github_connected")),
                "linkedin_connected": bool(merged.get("linkedin_connected")),
                "target_role": merged.get("target_role", "Full Stack Developer"),
            }
            fb_auth.set_custom_user_claims(uid, claims)
    except Exception as e:
        print(f"Could not update Firebase custom claims for {uid}: {e}")

    # 3. Best-effort Firestore sync (if Firestore API is enabled)
    try:
        import firebase_admin
        from firebase_admin import firestore
        if firebase_admin._apps:
            db = firestore.client()
            db.collection("users").document(uid).set(merged, merge=True)
    except Exception:
        # Ignore if Firestore is disabled in console
        pass

    return merged


def is_onboarding_completed(uid: str) -> bool:
    """Check if the user has completed onboarding and connected accounts."""
    profile = get_user_profile(uid)
    if not profile:
        return False
    return bool(
        profile.get("onboarding_completed") or
        profile.get("github_connected") or
        profile.get("linkedin_connected")
    )
