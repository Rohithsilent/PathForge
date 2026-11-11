from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from jose import jwt

from schemas.schemas import WhatIfRequest, WhatIfResponse
from services.scoring_service import career_readiness, whatif_simulation
from services.ai_service import generate_gap_explanations, generate_career_roadmap
from services.graph_service import get_graph
from seed_data import CAREER_ROLES
from config import settings

router = APIRouter(tags=["career"])

# Implied skills — if you know X, you almost certainly know Y
IMPLIED_SKILLS = {
    "React":        ["HTML", "CSS", "JavaScript"],
    "Next.js":      ["React", "HTML", "CSS", "JavaScript"],
    "Vue.js":       ["HTML", "CSS", "JavaScript"],
    "Angular":      ["HTML", "CSS", "TypeScript", "JavaScript"],
    "Svelte":       ["HTML", "CSS", "JavaScript"],
    "Node.js":      ["JavaScript"],
    "Express.js":   ["Node.js", "JavaScript"],
    "NestJS":       ["Node.js", "TypeScript"],
    "FastAPI":      ["Python"],
    "Django":       ["Python"],
    "Flask":        ["Python"],
    "Spring Boot":  ["Java"],
    "PyTorch":      ["Python"],
    "TensorFlow":   ["Python"],
    "scikit-learn": ["Python"],
    "Pandas":       ["Python"],
    "NumPy":        ["Python"],
    "React Native": ["React", "JavaScript"],
    "Flutter":      ["Dart"],
    "Tailwind CSS": ["CSS"],
    "SCSS":         ["CSS"],
    "TypeScript":   ["JavaScript"],
    "Docker":       ["Linux"],
    "Kubernetes":   ["Docker"],
}


def _readiness_components(target_role: str, user_nodes: Optional[List[dict]] = None) -> dict:
    """Single source of truth for the readiness score.

    Used by both /career/readiness and /career/whatif so the number shown in
    the Insights ring and the what-if baseline can never diverge.
    """
    role_data = CAREER_ROLES.get(target_role, CAREER_ROLES.get("Full Stack Developer", CAREER_ROLES[list(CAREER_ROLES.keys())[0]]))
    required = role_data["required"]

    if user_nodes is None:
        graph = get_graph()
        user_nodes = graph.get("nodes", [])
    user_skill_names_raw = [n["name"] for n in user_nodes if n.get("category") != "repo"]

    # Build expanded user skills set (lowercase for matching)
    user_skills_lower = set()
    for name in user_skill_names_raw:
        user_skills_lower.add(name.lower())
        for known, implies in IMPLIED_SKILLS.items():
            if name.lower() == known.lower():
                for imp in implies:
                    user_skills_lower.add(imp.lower())

    # Match required skills (case-insensitive)
    matched = [s for s in required if s.lower() in user_skills_lower]
    coverage = len(matched) / len(required) if required else 0

    # Average maturity of matched skills (find nodes case-insensitively)
    matched_nodes = [n for n in user_nodes if n["name"].lower() in {s.lower() for s in matched}]
    avg_maturity = (
        sum(n.get("maturity", 50) for n in matched_nodes) / len(matched_nodes)
        if matched_nodes
        else 0
    ) / 100

    # Market alignment
    market_scores = [n.get("market_demand", 70) for n in matched_nodes]
    market_alignment = (
        sum(market_scores) / len(market_scores) if market_scores else 0
    ) / 100

    # Project depth
    repo_count = len([n for n in user_nodes if n.get("category") == "repo"])
    project_depth = min(1.0, repo_count / 10)

    score = career_readiness(coverage, avg_maturity, market_alignment, project_depth)

    # Gaps — only skills NOT implied by what the user already knows
    missing = [s for s in required if s.lower() not in user_skills_lower][:5]

    return {
        "score": score,
        "target_role": target_role,
        "coverage": coverage,
        "avg_maturity": avg_maturity,
        "market_alignment": market_alignment,
        "project_depth": project_depth,
        "total_skills": len(user_skill_names_raw),
        "matched": matched,
        "missing": missing,
        "user_nodes": user_nodes,
    }


@router.get("/readiness")
async def get_career_readiness(
    target_role: str = "Full Stack Developer",
    provider: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    """Calculate career readiness score for a target role using REAL graph data."""
    user_nodes = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            uid = payload.get("sub") or payload.get("username")
            if uid:
                from services import user_service
                user_graph = user_service.get_user_graph(uid)
                if not user_graph or not user_graph.get("nodes"):
                    profile = user_service.get_user_profile(uid)
                    if profile and (profile.get("github_repos") or profile.get("skills")):
                        user_graph = user_service.reconstruct_graph_from_profile(profile)
                if user_graph and user_graph.get("nodes"):
                    user_nodes = user_graph["nodes"]
        except Exception as e:
            print(f"Error extracting user nodes for readiness: {e}")

    data = _readiness_components(target_role, user_nodes=user_nodes)
    explanations = generate_gap_explanations(data["missing"], target_role, provider=provider)
    gaps = [
        {
            "skill": skill,
            "priority": round(0.95 - i * 0.08, 2),
            "reason": explanations.get(
                skill,
                f"{skill} is commonly required for {target_role} roles.",
            ),
        }
        for i, skill in enumerate(data["missing"])
    ]

    return {
        "career_readiness": data["score"],
        "target_role": target_role,
        "skill_coverage": round(data["coverage"], 2),
        "avg_maturity": round(data["avg_maturity"] * 100, 1),
        "market_alignment": round(data["market_alignment"] * 100, 1),
        "total_skills": data["total_skills"],
        "matched_skills": data["matched"],
        "gaps": gaps,
        "available_roles": list(CAREER_ROLES.keys()),
    }


@router.post("/whatif", response_model=WhatIfResponse)
async def what_if_simulation(
    req: WhatIfRequest,
    authorization: Optional[str] = Header(None)
):
    """Simulate adding skills and show how readiness score changes."""
    simulated = [s.strip() for s in req.add_skills if s and s.strip()]
    if not simulated:
        raise HTTPException(status_code=400, detail="Provide at least one skill to simulate.")

    user_nodes = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            uid = payload.get("sub") or payload.get("username")
            if uid:
                from services import user_service
                user_graph = user_service.get_user_graph(uid)
                if not user_graph or not user_graph.get("nodes"):
                    profile = user_service.get_user_profile(uid)
                    if profile and (profile.get("github_repos") or profile.get("skills")):
                        user_graph = user_service.reconstruct_graph_from_profile(profile)
                if user_graph and user_graph.get("nodes"):
                    user_nodes = user_graph["nodes"]
        except Exception as e:
            print(f"Error extracting user nodes for whatif: {e}")

    target_role = req.target_role or "Full Stack Developer"
    readiness = _readiness_components(target_role, user_nodes=user_nodes)
    current_score = readiness["score"]
    user_nodes = readiness["user_nodes"]
    skill_nodes = [n for n in user_nodes if n.get("category") != "repo"]

    # Build context string for the model
    if skill_nodes:
        lines = [f"{n['name']} ({n.get('category','?')}, maturity: {n.get('maturity',50):.0f}%, demand: {n.get('market_demand',70):.0f}%)" for n in sorted(skill_nodes, key=lambda x: x.get('maturity',0), reverse=True)[:15]]
        graph_context = "Current skills:\n" + "\n".join(f"  - {l}" for l in lines)
    else:
        graph_context = ""

    result = whatif_simulation(
        current_score,
        simulated,
        graph_context,
        engine=req.engine or "orbitx",
        provider=req.provider,
    )
    return WhatIfResponse(**result)


@router.get("/roadmap")
async def get_roadmap(
    target_role: str = "Full Stack Developer",
    provider: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    """Generate a learning roadmap for a target career role."""
    user_nodes = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            uid = payload.get("sub") or payload.get("username")
            if uid:
                from services import user_service
                user_graph = user_service.get_user_graph(uid)
                if not user_graph or not user_graph.get("nodes"):
                    profile = user_service.get_user_profile(uid)
                    if profile and (profile.get("github_repos") or profile.get("skills")):
                        user_graph = user_service.reconstruct_graph_from_profile(profile)
                if user_graph and user_graph.get("nodes"):
                    user_nodes = user_graph["nodes"]
        except Exception as e:
            print(f"Error extracting user nodes for roadmap: {e}")

    if user_nodes is None:
        graph = get_graph()
        user_nodes = graph.get("nodes", [])

    current_skills = [n["name"] for n in user_nodes if n.get("category") != "repo"]

    # Get gaps
    role_data = CAREER_ROLES.get(target_role, CAREER_ROLES.get("Full Stack Developer", CAREER_ROLES[list(CAREER_ROLES.keys())[0]]))
    missing = [s for s in role_data["required"] if s not in current_skills]
    gaps = [{"skill": s, "priority": 0.8} for s in missing[:5]]

    roadmap = generate_career_roadmap(current_skills, target_role, gaps, provider=provider)
    return roadmap


@router.get("/roles")
async def list_roles():
    """List all available career roles."""
    return {
        "roles": [
            {
                "name": role,
                "required_count": len(data["required"]),
                "nice_to_have_count": len(data["nice_to_have"]),
            }
            for role, data in CAREER_ROLES.items()
        ]
    }
