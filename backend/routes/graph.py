from fastapi import APIRouter, HTTPException, Header
from typing import List, Dict, Any, Optional
from jose import jwt

from schemas.schemas import GitHubSyncRequest, RepoAnalyzeRequest
from services.graph_service import get_graph, save_graph
from services.github_service import sync_github_data
from services.repo_analyzer import analyze_public_repo
from seed_data import DEMO_NODES, DEMO_LINKS
from config import settings

router = APIRouter(tags=["graph"])


@router.get("/")
async def get_graph_data(authorization: Optional[str] = Header(None)):
    """Return the full knowledge graph (user-specific if authenticated)."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            uid = payload.get("sub") or payload.get("username")
            if uid:
                from services import user_service
                user_graph = user_service.get_user_graph(uid)
                if user_graph and user_graph.get("nodes"):
                    return user_graph
                # Attempt reconstruction from profile
                profile = user_service.get_user_profile(uid)
                if profile and (profile.get("github_repos") or profile.get("skills")):
                    reconstructed = user_service.reconstruct_graph_from_profile(profile)
                    if reconstructed and reconstructed.get("nodes"):
                        user_service.save_user_graph(uid, reconstructed)
                        return reconstructed
        except Exception as e:
            print(f"Error resolving user graph from token: {e}")

    graph = get_graph()
    return graph


@router.get("/demo")
@router.post("/demo")
async def seed_demo_graph():
    """Return the bundled demo dataset for offline exploration without corrupting active user graphs."""
    return {"nodes": DEMO_NODES, "links": DEMO_LINKS, "seeded": True}


@router.post("/sync/github")
async def sync_github_graph(
    payload: GitHubSyncRequest,
    authorization: Optional[str] = Header(None)
):
    """Sync graph with GitHub data — fully replaces old graph."""
    token = (payload.token or "").strip()
    if not token:
        raise HTTPException(
            status_code=400,
            detail="A GitHub access token is required to sync your repositories.",
        )
    try:
        print("DEBUG: Syncing GitHub data...")
        data = await sync_github_data(token)
        # Replace entire graph so deleted repos / stale skills are removed
        save_graph(data["nodes"], data["links"])

        # Also persist to user's private store if authenticated
        if authorization and authorization.startswith("Bearer "):
            try:
                tok = authorization.split(" ")[1]
                p = jwt.decode(tok, settings.jwt_secret, algorithms=["HS256"])
                uid = p.get("sub") or p.get("username")
                if uid:
                    from services import user_service
                    user_service.save_user_graph(uid, {"nodes": data["nodes"], "links": data["links"]})
            except Exception:
                pass

        print(f"DEBUG: Sync complete. {len(data['nodes'])} nodes, {len(data['links'])} links.")
        return {
            "status": "synced",
            "nodes": len(data["nodes"]),
            "links": len(data["links"])
        }
    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        print(f"ERROR: GitHub sync failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to sync GitHub data. Check the server log for details.")


@router.post("/analyze-repo")
async def analyze_repo(payload: RepoAnalyzeRequest):
    """Analyze a public GitHub repo by URL — no auth needed."""
    try:
        print(f"DEBUG: Analyzing repo URL: {payload.url} (engine: {payload.engine})")
        data = await analyze_public_repo(
            payload.url,
            engine=payload.engine or "orbitx",
            provider=payload.provider,
        )
        save_graph(data["nodes"], data["links"])
        print(f"DEBUG: Analysis complete. {len(data['nodes'])} nodes, {len(data['links'])} links.")
        return {
            "status": "analyzed",
            "nodes": len(data["nodes"]),
            "links": len(data["links"]),
            "graph": data,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"ERROR: Repo analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze repo: {str(e)}")


@router.post("/refresh")
async def refresh_graph():
    """Re-seed graph data (useful after new data sources are connected)."""
    # Modification: Removed demo data seeding
    return {"status": "refreshed", "nodes": 0, "links": 0}
