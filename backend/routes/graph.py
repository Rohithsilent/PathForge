from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from schemas.schemas import GitHubSyncRequest, RepoAnalyzeRequest
from services.graph_service import get_graph, save_graph
from services.github_service import sync_github_data
from services.repo_analyzer import analyze_public_repo
from seed_data import DEMO_NODES, DEMO_LINKS
from config import settings

router = APIRouter(tags=["graph"])


@router.get("/")
async def get_graph_data():
    """Return the full knowledge graph (nodes + links)."""
    graph = get_graph()
    return graph


@router.post("/demo")
async def seed_demo_graph():
    """Populate the graph with the bundled demo dataset.

    Fully replaces the current graph (same semantics as a sync), so repeated
    calls are idempotent and never duplicate nodes or links. Runs entirely
    offline — no external API or AI provider calls.
    """
    save_graph([dict(node) for node in DEMO_NODES], [dict(link) for link in DEMO_LINKS])
    graph = get_graph()
    return {"nodes": graph["nodes"], "links": graph["links"], "seeded": True}


@router.post("/sync/github")
async def sync_github_graph(payload: GitHubSyncRequest):
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
