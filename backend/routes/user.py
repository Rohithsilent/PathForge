"""
User profile and connected accounts routes.
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, Dict, Any
from jose import jwt, JWTError

from config import settings
from services import user_service
from services.graph_service import get_graph

router = APIRouter(prefix="/user", tags=["user"])


def _extract_user_from_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/profile")
async def get_profile(user_payload: Dict[str, Any] = Depends(_extract_user_from_token)):
    """Retrieve full persistent user profile."""
    uid = user_payload.get("sub") or user_payload.get("username")
    profile = user_service.get_user_profile(uid)
    if not profile:
        profile = {
            "uid": uid,
            "name": user_payload.get("name", "Developer"),
            "email": user_payload.get("email", ""),
            "avatar": user_payload.get("avatar", ""),
            "auth_provider": user_payload.get("auth_provider", "google"),
            "target_role": "Full Stack Developer",
            "onboarding_completed": False,
            "github_connected": False,
            "linkedin_connected": False,
        }
        user_service.save_user_profile(uid, profile)

    # Aggregate live skills from graph and user data
    graph = get_graph()
    nodes = graph.get("nodes", [])
    graph_skills = [n for n in nodes if n.get("category") != "repo"]

    # Also incorporate saved linkedin_skills if not in graph
    all_skills_map = {}
    for s in graph_skills:
        name = s.get("name", "")
        if name:
            all_skills_map[name.lower()] = {
                "name": name,
                "category": s.get("category", "concept"),
                "source": s.get("source", "github"),
                "val": s.get("val", 10),
                "repos": s.get("repos", [s.get("repo")] if s.get("repo") else []),
            }

    # Merge saved LinkedIn skills
    saved_li_skills = profile.get("linkedin_skills", [])
    for li_s in saved_li_skills:
        skill_name = li_s if isinstance(li_s, str) else li_s.get("name", "")
        category = li_s.get("category", "concept") if isinstance(li_s, dict) else "concept"
        if not skill_name:
            continue
        key = skill_name.lower()
        if key in all_skills_map:
            all_skills_map[key]["source"] = "both"
        else:
            all_skills_map[key] = {
                "name": skill_name,
                "category": category,
                "source": "linkedin",
                "val": 10,
                "repos": [],
            }

    skills_list = list(all_skills_map.values())
    skills_list.sort(key=lambda x: (x.get("source") != "both", x.get("name").lower()))

    # Calculate categories count
    categories_count = {}
    for s in skills_list:
        cat = s.get("category", "concept")
        categories_count[cat] = categories_count.get(cat, 0) + 1

    profile["total_skills"] = len(skills_list)
    profile["total_nodes"] = len(nodes)
    profile["skills"] = skills_list
    profile["categories_count"] = categories_count
    
    # Repos count
    saved_repos = profile.get("github_repos", [])
    repo_nodes = [n for n in nodes if n.get("category") == "repo"]
    profile["total_repos"] = max(len(saved_repos), len(repo_nodes), profile.get("github_profile", {}).get("public_repos", 0))

    return profile


@router.post("/profile")
async def update_profile(
    updates: Dict[str, Any],
    user_payload: Dict[str, Any] = Depends(_extract_user_from_token)
):
    """Update profile and connected accounts, saving to Firebase and local storage."""
    uid = user_payload.get("sub") or user_payload.get("username")
    saved = user_service.save_user_profile(uid, updates)
    return {"status": "updated", "profile": saved}
