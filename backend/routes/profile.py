"""
Shareable public profile endpoint.
Generates a short slug and serves a read-only skill summary.
"""
import hashlib
import json
import os
import tempfile
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from routes.career import _readiness_components
from services.graph_service import get_graph

router = APIRouter(tags=["profile"])

DEFAULT_TARGET_ROLE = "Full Stack Developer"

# Persistent store: slug → profile snapshot (backend/data/profiles.json)
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
_PROFILES_PATH = os.path.join(_DATA_DIR, "profiles.json")


def _load_profiles() -> dict:
    """Load snapshots from disk, tolerating a missing or corrupt file."""
    try:
        with open(_PROFILES_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def _save_profiles(profiles: dict) -> None:
    """Atomically persist snapshots (temp file + os.replace)."""
    os.makedirs(_DATA_DIR, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=_DATA_DIR, prefix=".profiles-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(profiles, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, _PROFILES_PATH)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


_profiles: dict = _load_profiles()


class GenerateProfileRequest(BaseModel):
    username: Optional[str] = "developer"


def _make_slug(username: str) -> str:
    """Generate a short readable slug from username + timestamp."""
    raw = f"{username}-{int(time.time())}"
    return hashlib.md5(raw.encode()).hexdigest()[:8]


def _build_profile_snapshot(
    username: str, target_role: str = DEFAULT_TARGET_ROLE
) -> dict:
    """Build a public-safe profile snapshot from the current graph."""
    graph = get_graph()
    nodes = graph.get("nodes", [])

    skill_nodes = [n for n in nodes if n.get("category") != "repo"]
    repo_nodes = [n for n in nodes if n.get("category") == "repo"]

    if not skill_nodes:
        return None

    # Top skills by maturity
    top_skills = sorted(skill_nodes, key=lambda n: n.get("maturity", 0), reverse=True)[:8]

    # Averages
    avg_maturity = round(sum(n.get("maturity", 0) for n in skill_nodes) / len(skill_nodes), 1)
    avg_demand = round(sum(n.get("market_demand", 0) for n in skill_nodes) / len(skill_nodes), 1)
    repo_count = len(repo_nodes)
    # Same formula as /career/readiness and /career/whatif so the profile,
    # Insights and What-If can never diverge.
    career_readiness = _readiness_components(target_role)["score"]

    # Category distribution
    distribution: dict = {}
    for node in skill_nodes:
        cat = node.get("category", "other")
        distribution[cat] = distribution.get(cat, 0) + 1

    return {
        "username": username,
        "career_readiness": career_readiness,
        "total_skills": len(skill_nodes),
        "total_repos": repo_count,
        "avg_maturity": avg_maturity,
        "avg_market_demand": avg_demand,
        "top_skills": [
            {
                "name": s["name"],
                "category": s.get("category", "concept"),
                "maturity": s.get("maturity", 50),
                "market_demand": s.get("market_demand", 70),
            }
            for s in top_skills
        ],
        "skill_distribution": distribution,
        "repos": [r["name"] for r in repo_nodes],
        "verified": True,
        "generated_at": int(time.time()),
    }


@router.post("/generate")
async def generate_profile(req: GenerateProfileRequest):
    """Generate a shareable profile link from the current graph state."""
    snapshot = _build_profile_snapshot(req.username or "developer")

    if not snapshot:
        raise HTTPException(
            status_code=400,
            detail="No skills found. Analyze a repository first."
        )

    slug = _make_slug(req.username or "developer")
    _profiles[slug] = snapshot
    _save_profiles(_profiles)

    return {"slug": slug, "url": f"/profile/{slug}"}


@router.get("/{slug}")
async def get_profile(slug: str):
    """Get a public profile by slug."""
    profile = _profiles.get(slug)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found or expired.")
    return profile
