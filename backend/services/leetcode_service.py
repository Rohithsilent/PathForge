"""
LeetCode skill extraction and profile integration service.

Fetches publicly available problem-solving statistics, language counts,
and topic tags from LeetCode's public GraphQL endpoint.
Transforms algorithmic expertise into verified concept & language nodes
within the candidate's knowledge graph.
"""
import httpx
from typing import Dict, Any, List, Optional
from services.market_data import get_market_demand

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

LEETCODE_QUERY = """
query getUserLeetCodeStats($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    tagProblemCounts {
      advanced {
        tagName
        problemsSolved
      }
      intermediate {
        tagName
        problemsSolved
      }
      fundamental {
        tagName
        problemsSolved
      }
    }
    languageProblemCount {
      languageName
      problemsSolved
    }
  }
}
"""


async def fetch_leetcode_profile(username: str) -> Dict[str, Any]:
    """Fetch public LeetCode user profile data via GraphQL."""
    clean_username = username.strip().lstrip("@")
    if not clean_username:
        raise ValueError("LeetCode username cannot be empty")

    headers = {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": USER_AGENT,
    }

    payload = {
        "query": LEETCODE_QUERY,
        "variables": {"username": clean_username},
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(LEETCODE_GRAPHQL_URL, json=payload, headers=headers)

    if response.status_code != 200:
        raise RuntimeError(f"LeetCode API responded with HTTP {response.status_code}")

    data = response.json()
    matched_user = data.get("data", {}).get("matchedUser")
    if not matched_user:
        raise ValueError(f"LeetCode user '{clean_username}' was not found. Please verify the username.")

    # Parse difficulty stats
    sub_stats = matched_user.get("submitStatsGlobal", {}).get("acSubmissionNum", [])
    stats_by_diff = {item["difficulty"]: item["count"] for item in sub_stats}
    total_solved = stats_by_diff.get("All", 0)
    easy_solved = stats_by_diff.get("Easy", 0)
    medium_solved = stats_by_diff.get("Medium", 0)
    hard_solved = stats_by_diff.get("Hard", 0)

    # Flatten tag problem counts
    tag_counts = matched_user.get("tagProblemCounts", {})
    all_tags: List[Dict[str, Any]] = []
    for tier in ("fundamental", "intermediate", "advanced"):
        for tag in tag_counts.get(tier, []):
            if tag.get("problemsSolved", 0) > 0:
                all_tags.append({
                    "name": tag["tagName"],
                    "tier": tier,
                    "problems_solved": tag["problemsSolved"],
                })

    # Sort tags by most problems solved
    all_tags.sort(key=lambda t: t["problems_solved"], reverse=True)

    # Languages
    lang_counts = [
        {"language": l["languageName"], "problems_solved": l["problemsSolved"]}
        for l in matched_user.get("languageProblemCount", [])
        if l.get("problemsSolved", 0) > 0
    ]
    lang_counts.sort(key=lambda l: l["problems_solved"], reverse=True)

    profile_meta = matched_user.get("profile", {}) or {}

    return {
        "username": clean_username,
        "ranking": profile_meta.get("ranking", 0),
        "reputation": profile_meta.get("reputation", 0),
        "total_solved": total_solved,
        "easy_solved": easy_solved,
        "medium_solved": medium_solved,
        "hard_solved": hard_solved,
        "tags": all_tags,
        "languages": lang_counts,
    }


def build_leetcode_graph_nodes(
    leetcode_data: Dict[str, Any],
    existing_nodes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Transform extracted LeetCode data into knowledge graph nodes and links.
    - Tags become 'concept' nodes with maturity scaled by problems solved.
    - Languages strengthen existing language nodes or create new ones.
    - A LeetCode profile node connects to all solved concepts and languages.
    """
    if existing_nodes is None:
        existing_nodes = []

    existing_by_id = {n["id"]: n for n in existing_nodes}
    existing_by_name = {n["name"].lower(): n for n in existing_nodes}

    nodes: List[Dict[str, Any]] = []
    links: List[Dict[str, Any]] = []
    seen_ids = set()

    username = leetcode_data["username"]
    profile_node_id = f"leetcode:{username.lower()}"

    # Overall LeetCode source node
    total_solved = leetcode_data.get("total_solved", 0)
    profile_node = {
        "id": profile_node_id,
        "name": f"LeetCode (@{username})",
        "category": "cert",
        "maturity": min(100, max(20, int((total_solved / 250) * 100))),
        "market_demand": 92,
        "val": 7.5,
        "source": "leetcode",
    }
    nodes.append(profile_node)
    seen_ids.add(profile_node_id)

    # 1. Algorithmic Concept Tags (Top 25 active topics)
    for tag_info in leetcode_data.get("tags", [])[:25]:
        tag_name = tag_info["name"]
        tag_id = tag_name.lower().replace(" ", "-").replace("/", "-")
        solved = tag_info["problems_solved"]

        # Calculate maturity: base 40 + bonus based on solved count
        maturity = min(100, int(40 + min(60, solved * 3.5)))
        demand = get_market_demand(tag_name)

        if tag_id in existing_by_id:
            # Boost existing node maturity and mark dual source
            existing_node = existing_by_id[tag_id]
            existing_node["maturity"] = max(existing_node.get("maturity", 50), maturity)
            if existing_node.get("source") != "leetcode":
                existing_node["source"] = "both"
        elif tag_name.lower() in existing_by_name:
            existing_node = existing_by_name[tag_name.lower()]
            existing_node["maturity"] = max(existing_node.get("maturity", 50), maturity)
            if existing_node.get("source") != "leetcode":
                existing_node["source"] = "both"
        else:
            if tag_id not in seen_ids:
                nodes.append({
                    "id": tag_id,
                    "name": tag_name,
                    "category": "concept",
                    "maturity": maturity,
                    "market_demand": demand,
                    "val": max(4.0, min(9.0, 4.0 + solved * 0.12)),
                    "source": "leetcode",
                })
                seen_ids.add(tag_id)

        # Link from LeetCode profile to the concept
        target_id = tag_id if tag_id in seen_ids else tag_id
        links.append({
            "source": profile_node_id,
            "target": target_id,
            "type": "PRACTICED",
            "strength": round(min(1.0, 0.4 + solved * 0.03), 2),
        })

    # 2. Languages Used
    for lang_info in leetcode_data.get("languages", []):
        raw_lang = lang_info["language"]
        solved = lang_info["problems_solved"]
        # Normalize language name (e.g. Python3 -> Python)
        canonical_lang = "Python" if raw_lang in ("Python", "Python3") else raw_lang
        lang_id = canonical_lang.lower()

        lang_maturity = min(100, int(50 + min(50, solved * 2)))

        if lang_id in existing_by_id:
            existing_node = existing_by_id[lang_id]
            existing_node["maturity"] = max(existing_node.get("maturity", 50), lang_maturity)
            if existing_node.get("source") != "leetcode":
                existing_node["source"] = "both"
            target_id = lang_id
        elif canonical_lang.lower() in existing_by_name:
            existing_node = existing_by_name[canonical_lang.lower()]
            existing_node["maturity"] = max(existing_node.get("maturity", 50), lang_maturity)
            if existing_node.get("source") != "leetcode":
                existing_node["source"] = "both"
            target_id = existing_node["id"]
        else:
            if lang_id not in seen_ids:
                nodes.append({
                    "id": lang_id,
                    "name": canonical_lang,
                    "category": "language",
                    "maturity": lang_maturity,
                    "market_demand": get_market_demand(canonical_lang),
                    "val": max(5.0, min(10.0, 5.0 + solved * 0.08)),
                    "source": "leetcode",
                })
                seen_ids.add(lang_id)
            target_id = lang_id

        links.append({
            "source": profile_node_id,
            "target": target_id,
            "type": "CODED_IN",
            "strength": round(min(1.0, 0.5 + solved * 0.02), 2),
        })

    return {"nodes": nodes, "links": links}
