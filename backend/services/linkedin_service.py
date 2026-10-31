"""
LinkedIn skill extraction service.

Since LinkedIn does not offer a public scraping API, this service:
1. Parses the LinkedIn profile URL to extract the username/slug
2. Accepts user-pasted profile text (About section, experience, skills)
3. Uses the AI service to extract skills, roles, and domains from the text
"""
import re
from typing import List, Dict, Any, Optional

from services import ai_service


def parse_linkedin_username(url: str) -> Optional[str]:
    """Extract LinkedIn username/slug from a profile URL."""
    if not url:
        return None
    # Handle formats:
    # https://www.linkedin.com/in/username/
    # https://linkedin.com/in/username
    match = re.search(r"linkedin\.com/in/([^/?#]+)", url)
    if match:
        return match.group(1).strip("/")
    return None


def extract_skills_from_text(profile_text: str, profile_url: str = "") -> Dict[str, Any]:
    """
    Use AI to extract structured skills, roles, and experience from LinkedIn profile text.
    Returns a dict with: skills, domains, roles, years_experience
    """
    username = parse_linkedin_username(profile_url) if profile_url else None

    if not profile_text or len(profile_text.strip()) < 20:
        return {
            "username": username,
            "skills": [],
            "domains": [],
            "roles": [],
            "years_experience": 0,
            "error": "Profile text is too short. Please paste more content.",
        }

    # Use ai_service to extract skills
    extraction = ai_service.extract_skills(
        source_type="linkedin",
        name=username or "linkedin_profile",
        languages=[],
        text=profile_text,
        commits=0,
    )

    # Also ask for roles/experience
    roles = _extract_roles_from_text(profile_text)
    years = _estimate_experience_years(profile_text)

    return {
        "username": username,
        "skills": extraction.get("skills", []),
        "domain": extraction.get("domain", ""),
        "domains": _extract_domains(profile_text),
        "roles": roles,
        "years_experience": years,
    }


def build_linkedin_graph_nodes(
    extracted: Dict[str, Any], existing_nodes: List[Dict] = None
) -> Dict[str, Any]:
    """
    Convert extracted LinkedIn data into graph nodes.
    Skills get source='linkedin' tag so they can be filtered separately.
    Returns new nodes + links.
    """
    if existing_nodes is None:
        existing_nodes = []

    existing_ids = {n["id"] for n in existing_nodes}

    new_nodes = []
    new_links = []

    # Root LinkedIn profile node
    username = extracted.get("username", "linkedin")
    profile_node_id = f"linkedin::{username or 'profile'}"

    if profile_node_id not in existing_ids:
        new_nodes.append({
            "id": profile_node_id,
            "name": f"LinkedIn: {username or 'Profile'}",
            "category": "profile",
            "source": "linkedin",
            "maturity": 80,
            "market_demand": 70,
            "val": 8,
        })

    # Skill nodes
    for item in extracted.get("skills", []):
        if isinstance(item, dict):
            skill_name = item.get("name", "").strip()
            skill_cat = item.get("category") or extracted.get("domain", "concept")
        else:
            skill_name = str(item).strip()
            skill_cat = extracted.get("domain", "concept")

        if not skill_name:
            continue

        skill_id = skill_name.lower().replace(" ", "_")
        if skill_id not in existing_ids:
            new_nodes.append({
                "id": skill_id,
                "name": skill_name,
                "category": skill_cat,
                "source": "linkedin",
                "maturity": 65,
                "market_demand": 70,
                "val": 5,
            })
        # Always add link from LinkedIn profile → skill
        new_links.append({
            "source": profile_node_id,
            "target": skill_id,
            "type": "HAS_SKILL",
            "strength": 0.7,
        })

    return {"nodes": new_nodes, "links": new_links}


# ── Private helpers ──────────────────────────────────────────────────────

_ROLE_PATTERNS = [
    r"\b(software\s+engineer|developer|architect|designer|data\s+scientist|"
    r"product\s+manager|devops|sre|full[\s-]?stack|backend|frontend|"
    r"mobile|cloud\s+engineer|ml\s+engineer|ai\s+engineer)\b",
]

def _extract_roles(text: str) -> List[str]:
    roles = []
    for pattern in _ROLE_PATTERNS:
        matches = re.findall(pattern, text.lower())
        roles.extend(m.strip() for m in matches)
    return list(set(roles))


def _extract_roles_from_text(text: str) -> List[str]:
    return _extract_roles(text)


def _extract_domains(text: str) -> List[str]:
    domain_keywords = {
        "Web Development": ["html", "css", "javascript", "react", "vue", "angular", "next.js"],
        "Backend": ["python", "java", "node", "go", "rust", "django", "fastapi", "spring"],
        "Data Science": ["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "ml", "machine learning"],
        "DevOps": ["docker", "kubernetes", "ci/cd", "jenkins", "github actions", "terraform", "aws", "gcp", "azure"],
        "Mobile": ["android", "ios", "react native", "flutter", "swift", "kotlin"],
        "Blockchain": ["solidity", "ethereum", "web3", "smart contract"],
        "AI/ML": ["llm", "gpt", "openai", "langchain", "rag", "vector"],
    }
    text_lower = text.lower()
    found = []
    for domain, keywords in domain_keywords.items():
        if any(kw in text_lower for kw in keywords):
            found.append(domain)
    return found


def _estimate_experience_years(text: str) -> int:
    """Rough heuristic: look for year patterns."""
    matches = re.findall(r"\b(20\d{2})\b", text)
    if len(matches) >= 2:
        years = [int(m) for m in matches]
        span = max(years) - min(years)
        return min(span, 20)  # cap at 20 years
    return 0
