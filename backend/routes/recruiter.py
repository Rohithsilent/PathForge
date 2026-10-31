from fastapi import APIRouter

from services.graph_service import get_graph

router = APIRouter(tags=["recruiter"])


@router.get("/profile")
async def get_recruiter_profile():
    """Generate recruiter evaluation profile from real graph data."""
    graph = get_graph()
    nodes = graph.get("nodes", [])

    # If no data, return empty profile
    if not nodes:
        return {
            "name": "Developer",
            "username": "user",
            "target_role": "Full Stack Developer",
            "career_readiness": 0,
            "skill_maturity_avg": 0,
            "project_depth": 0,
            "market_alignment": 0,
            "risk_areas": [],
            "top_skills": [],
            "skill_distribution": {},
            "radar_data": [],
            "total_skills": 0,
            "total_sources": 0,
        }

    # Skill nodes only (exclude repos)
    skill_nodes = [n for n in nodes if n.get("category") != "repo"]

    # Skill distribution by category
    distribution = {}
    for node in skill_nodes:
        cat = node.get("category", "other")
        distribution[cat] = distribution.get(cat, 0) + 1

    # Top skills by maturity
    top_skills = sorted(skill_nodes, key=lambda n: n.get("maturity", 0), reverse=True)[:5]

    # Average maturity
    maturities = [n.get("maturity", 0) for n in skill_nodes]
    avg_maturity = round(sum(maturities) / len(maturities), 1) if maturities else 0

    # Market alignment average
    demands = [n.get("market_demand", 0) for n in skill_nodes]
    avg_demand = round(sum(demands) / len(demands), 1) if demands else 0

    # Project depth (how many repos)
    repo_count = len([n for n in nodes if n.get("category") == "repo"])
    project_depth = round(min(100, repo_count * 10), 1)

    # Career readiness estimate
    career_readiness = round(min(100, (avg_maturity * 0.4 + avg_demand * 0.3 + project_depth * 0.3)), 1)

    # Risk areas — skills with low maturity but high demand
    risk_areas = [
        n["name"]
        for n in skill_nodes
        if n.get("maturity", 0) < 50 and n.get("market_demand", 0) > 75
    ]

    # Radar chart data
    radar_data = [
        {"axis": "Frontend",  "value": _avg_category(skill_nodes, "frontend")},
        {"axis": "Backend",   "value": _avg_category(skill_nodes, "backend")},
        {"axis": "ML/AI",     "value": _avg_category(skill_nodes, "ml")},
        {"axis": "DevOps",    "value": _avg_category(skill_nodes, "devops")},
        {"axis": "Database",  "value": _avg_category(skill_nodes, "database")},
        {"axis": "Concepts",  "value": _avg_category(skill_nodes, "concept")},
    ]

    return {
        "name": "Developer",
        "username": "user",
        "target_role": "Full Stack Developer",
        "career_readiness": career_readiness,
        "skill_maturity_avg": avg_maturity,
        "project_depth": project_depth,
        "market_alignment": avg_demand,
        "risk_areas": risk_areas,
        "top_skills": [
            {"name": s["name"], "maturity": s["maturity"], "category": s["category"]}
            for s in top_skills
        ],
        "skill_distribution": distribution,
        "radar_data": radar_data,
        "total_skills": len(skill_nodes),
        "total_sources": repo_count,
    }


def _avg_category(nodes: list, category: str) -> float:
    """Average maturity for a skill category."""
    cat_nodes = [n for n in nodes if n.get("category") == category]
    if not cat_nodes:
        return 0
    return round(sum(n.get("maturity", 0) for n in cat_nodes) / len(cat_nodes), 1)

