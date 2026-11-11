"""
LeetCode integration router.
Fetches public LeetCode problem stats, topic tags, and languages,
and merges verified algorithmic nodes into the user's skill graph.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from schemas.schemas import LeetCodeRequest
from services import leetcode_service
from services.graph_service import get_graph, save_graph
from services import user_service

router = APIRouter(tags=["leetcode"])


@router.post("/analyze")
async def analyze_leetcode(
    payload: LeetCodeRequest,
    authorization: Optional[str] = Header(None)
):
    """Fetch public LeetCode stats for a username and merge into the knowledge graph."""
    if not payload.username or not payload.username.strip():
        raise HTTPException(status_code=400, detail="LeetCode username cannot be empty.")

    try:
        data = await leetcode_service.fetch_leetcode_profile(payload.username.strip())
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to query LeetCode API: {e}")

    # Extract user ID if authenticated
    uid = None
    if authorization and authorization.startswith("Bearer "):
        try:
            from jose import jwt
            from config import settings
            tok = authorization.split(" ")[1]
            p = jwt.decode(tok, settings.jwt_secret, algorithms=["HS256"])
            uid = p.get("sub") or p.get("username")
        except Exception:
            pass

    # Merge into the existing user or active knowledge graph
    user_graph = user_service.get_user_graph(uid) if uid else None
    current_graph = user_graph if (user_graph and user_graph.get("nodes")) else get_graph()
    existing_nodes = current_graph.get("nodes", [])
    existing_links = current_graph.get("links", [])

    generated = leetcode_service.build_leetcode_graph_nodes(data, existing_nodes)

    existing_ids = {n["id"] for n in existing_nodes}
    merged_nodes = list(existing_nodes)

    # Append genuinely new nodes
    for n in generated["nodes"]:
        if n["id"] not in existing_ids:
            merged_nodes.append(n)
            existing_ids.add(n["id"])

    merged_links = list(existing_links) + generated["links"]

    save_graph(merged_nodes, merged_links)

    if uid:
        user_service.save_user_graph(uid, {"nodes": merged_nodes, "links": merged_links})
        user_service.save_user_profile(uid, {
            "leetcode_username": data["username"],
            "leetcode_connected": True,
            "leetcode_stats": {
                "total_solved": data["total_solved"],
                "easy_solved": data["easy_solved"],
                "medium_solved": data["medium_solved"],
                "hard_solved": data["hard_solved"],
                "ranking": data["ranking"],
            },
            "onboarding_completed": True,
        })

    return {
        "status": "merged",
        "username": data["username"],
        "total_solved": data["total_solved"],
        "easy_solved": data["easy_solved"],
        "medium_solved": data["medium_solved"],
        "hard_solved": data["hard_solved"],
        "ranking": data["ranking"],
        "reputation": data["reputation"],
        "tags_count": len(data["tags"]),
        "languages": data["languages"],
        "new_nodes_count": len(generated["nodes"]),
        "new_links_count": len(generated["links"]),
        "graph": {"nodes": merged_nodes, "links": merged_links},
    }

