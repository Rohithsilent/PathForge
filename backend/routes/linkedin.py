"""
LinkedIn profile integration routes.

Since LinkedIn does not support public scraping, we rely on:
1. User pasting their LinkedIn "About" + skills + experience text
2. AI-powered skill extraction from that text
3. Merging extracted skills into the knowledge graph with source='linkedin'
"""
from fastapi import APIRouter, HTTPException

from schemas.schemas import LinkedInRequest
from services import linkedin_service
from services.graph_service import get_graph, save_graph

router = APIRouter(tags=["linkedin"])


@router.post("/analyze")
async def analyze_linkedin_profile(payload: LinkedInRequest):
    """
    Extract skills and roles from pasted LinkedIn profile text,
    then merge them into the existing knowledge graph.
    """
    if not payload.profile_text or len(payload.profile_text.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Please paste at least a few sentences from your LinkedIn profile (About section, skills, or experience)."
        )

    # Extract skills via AI
    extracted = linkedin_service.extract_skills_from_text(
        profile_text=payload.profile_text,
        profile_url=payload.profile_url or "",
    )

    if extracted.get("error"):
        raise HTTPException(status_code=400, detail=extracted["error"])

    # Build new graph nodes from LinkedIn data
    current_graph = get_graph()
    existing_nodes = current_graph.get("nodes", [])
    existing_links = current_graph.get("links", [])

    linkedin_graph = linkedin_service.build_linkedin_graph_nodes(extracted, existing_nodes)

    # Merge: append new nodes + links (no duplicates)
    existing_ids = {n["id"] for n in existing_nodes}
    merged_nodes = list(existing_nodes)
    for n in linkedin_graph["nodes"]:
        if n["id"] not in existing_ids:
            merged_nodes.append(n)
            existing_ids.add(n["id"])

    merged_links = list(existing_links) + linkedin_graph["links"]

    save_graph(merged_nodes, merged_links)

    return {
        "status": "merged",
        "extracted": extracted,
        "new_nodes": len(linkedin_graph["nodes"]),
        "new_links": len(linkedin_graph["links"]),
        "total_nodes": len(merged_nodes),
        "graph": {"nodes": merged_nodes, "links": merged_links},
    }


@router.post("/parse-url")
async def parse_linkedin_url(payload: LinkedInRequest):
    """Parse a LinkedIn URL to extract the username slug."""
    username = linkedin_service.parse_linkedin_username(payload.profile_url or "")
    if not username:
        raise HTTPException(
            status_code=400,
            detail="Could not extract username from URL. Make sure it's a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)."
        )
    return {"username": username, "profile_url": f"https://linkedin.com/in/{username}"}
