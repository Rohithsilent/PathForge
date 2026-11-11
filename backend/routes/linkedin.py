"""
LinkedIn profile integration routes.

Since LinkedIn does not support public scraping, we rely on:
1. User pasting their LinkedIn "About" + skills + experience text
2. AI-powered skill extraction from that text
3. Merging extracted skills into the knowledge graph with source='linkedin'
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from jose import jwt
from config import settings

from schemas.schemas import LinkedInRequest
from services import linkedin_service
from services.graph_service import get_graph, save_graph
from services import user_service

router = APIRouter(tags=["linkedin"])


@router.post("/analyze")
async def analyze_linkedin_profile(
    payload: LinkedInRequest,
    authorization: Optional[str] = Header(None),
):
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

    # Extract user ID if authenticated
    uid = None
    if authorization and authorization.startswith("Bearer "):
        try:
            tok = authorization.split(" ")[1]
            p = jwt.decode(tok, settings.jwt_secret, algorithms=["HS256"])
            uid = p.get("sub") or p.get("username")
        except Exception:
            pass

    # Build new graph nodes from LinkedIn data
    user_graph = user_service.get_user_graph(uid) if uid else None
    current_graph = user_graph if (user_graph and user_graph.get("nodes")) else get_graph()
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

    if uid:
        user_service.save_user_graph(uid, {"nodes": merged_nodes, "links": merged_links})
        user_service.save_user_profile(uid, {
            "linkedin_connected": True,
            "linkedin_skills": extracted.get("skills", []),
            "onboarding_completed": True,
        })

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
