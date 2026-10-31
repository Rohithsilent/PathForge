import httpx
from typing import List, Dict, Any

from services.ai_service import extract_skills as ai_extract_skills
from services.tech_directory import match_technologies, TECH_DIRECTORY
from services.market_data import get_market_demand


GITHUB_API = "https://api.github.com"


async def fetch_repos(access_token: str) -> List[Dict]:
    """Fetch user's repositories sorted by last updated (includes topics)."""
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.mercy-preview+json",
    }
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        res = await client.get(
            f"{GITHUB_API}/user/repos?per_page=50&sort=updated",
            headers=headers,
        )
    if res.status_code == 401:
        raise PermissionError("GitHub rejected the access token (invalid or expired).")
    if res.status_code != 200:
        raise RuntimeError(f"GitHub returned HTTP {res.status_code} while fetching repos.")
    data = res.json()
    if not isinstance(data, list):
        raise RuntimeError("Unexpected response shape from GitHub.")
    return data


async def fetch_readme(access_token: str, owner: str, repo: str) -> str:
    """Fetch raw README content (truncated to 3000 chars)."""
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.raw",
    }
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        try:
            res = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/readme",
                headers=headers,
            )
            if res.status_code == 200:
                return res.text[:3000]
        except Exception:
            pass
        return ""


async def fetch_languages(access_token: str, owner: str, repo: str) -> Dict:
    """Fetch language breakdown for a repo."""
    headers = {"Authorization": f"token {access_token}"}
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        try:
            res = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/languages",
                headers=headers,
            )
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass
        return {}


def _maturity_from_stars(stars: int) -> int:
    if stars >= 50:
        return 95
    elif stars >= 20:
        return 85
    elif stars >= 5:
        return 70
    elif stars >= 1:
        return 55
    return 40


async def sync_github_data(token: str) -> Dict[str, Any]:
    """
    Build a rich knowledge graph from GitHub repos + READMEs.

    Strategy (layered):
    1. Repo topics from GitHub API
    2. Per-repo language breakdown from GitHub API
    3. Tech Directory scan (300+ technologies with aliases)
    4. Gemini AI extraction (if API key available)

    All results are merged and deduplicated.
    """
    print("SYNC: fetching repos...")
    repos = await fetch_repos(token)
    print(f"SYNC: got {len(repos)} repos")

    nodes: List[Dict] = []
    links: List[Dict] = []
    seen_ids: set = set()

    # Track how many repos use each skill for dynamic maturity
    skill_usage: Dict[str, Dict] = {}  # skill_id -> {count, total_stars, confidence, category, name}

    def register_skill(skill_id: str, name: str, category: str, confidence: float, repo_stars: int):
        """Track skill usage across repos for maturity calculation."""
        if skill_id not in skill_usage:
            skill_usage[skill_id] = {
                "name": name, "category": category,
                "confidence": confidence, "count": 0, "total_stars": 0,
            }
        skill_usage[skill_id]["count"] += 1
        skill_usage[skill_id]["total_stars"] += repo_stars
        if confidence > skill_usage[skill_id]["confidence"]:
            skill_usage[skill_id]["confidence"] = confidence

    def add_node(n: Dict):
        if n["id"] not in seen_ids:
            nodes.append(n)
            seen_ids.add(n["id"])

    def compute_maturity(skill_id: str) -> int:
        """Dynamic maturity: base confidence + usage bonus + star bonus."""
        info = skill_usage.get(skill_id)
        if not info:
            return 50
        base = int(info["confidence"] * 50)           # 0-50 from confidence
        usage_bonus = min(30, info["count"] * 10)      # +10 per repo, caps at 30
        star_bonus = min(20, info["total_stars"] * 3)   # +3 per star, caps at 20
        return min(100, base + usage_bonus + star_bonus)

    # ── Pass 1: Create repo nodes + track primary languages ──
    for repo in repos:
        repo_id = f"repo:{repo['name']}"
        stars = repo.get("stargazers_count", 0)
        forks = repo.get("forks_count", 0)

        add_node({
            "id": repo_id,
            "name": repo["name"],
            "category": "repo",
            "maturity": _maturity_from_stars(stars),
            "market_demand": min(100, 50 + stars * 2 + forks * 3),
            "source": "github",
            "val": max(4, min(15, 4 + stars * 0.5)),
        })

        lang = repo.get("language")
        if lang:
            lang_id = lang.lower()
            lang_cat = TECH_DIRECTORY[lang][0] if lang in TECH_DIRECTORY else "language"
            register_skill(lang_id, lang, lang_cat, 0.9, stars)
            links.append({
                "source": repo_id, "target": lang_id,
                "type": "WRITTEN_IN", "strength": 0.9,
            })

    # ── Pass 2: Deep analysis of recent repos ──
    recent = repos[:15]
    print(f"SYNC: deep-analyzing {len(recent)} repos...")

    for repo in recent:
        repo_id = f"repo:{repo['name']}"
        owner = repo["owner"]["login"]
        lang = repo.get("language")
        stars = repo.get("stargazers_count", 0)
        description = repo.get("description") or ""
        topics = repo.get("topics", [])

        # Fetch README + language breakdown
        readme = await fetch_readme(token, owner, repo["name"])
        repo_languages = await fetch_languages(token, owner, repo["name"])
        all_lang_names = list(repo_languages.keys())

        # Register all detected languages
        for rl in all_lang_names:
            rl_id = rl.lower()
            rl_cat = TECH_DIRECTORY[rl][0] if rl in TECH_DIRECTORY else "language"
            register_skill(rl_id, rl, rl_cat, 0.8, stars)
            links.append({
                "source": repo_id, "target": rl_id,
                "type": "WRITTEN_IN", "strength": 0.7,
            })

        # Register topics
        for topic in topics:
            topic_id = topic.lower().replace(" ", "-")
            canonical = topic.replace("-", " ").title()
            category = "concept"
            for tech_name, (cat, aliases) in TECH_DIRECTORY.items():
                if topic_id in aliases or topic in aliases:
                    canonical = tech_name
                    category = cat
                    break
            register_skill(topic_id, canonical, category, 0.75, stars)
            links.append({
                "source": repo_id, "target": topic_id,
                "type": "TAGGED", "strength": 0.8,
            })

        # ── Tech Directory Scan ──
        combined_text = f"{description}\n{' '.join(topics)}\n{' '.join(all_lang_names)}\n{readme}"
        directory_matches = match_technologies(combined_text)
        print(f"  {repo['name']}: directory matched {len(directory_matches)} technologies")

        # ── Gemini AI extraction ──
        ai_result = ai_extract_skills(
            source_type="github",
            name=repo["name"],
            languages=all_lang_names if all_lang_names else ([lang] if lang else []),
            text=combined_text,
            commits=repo.get("open_issues_count", 0),
        )

        ai_skills: List[Dict] = []
        if ai_result and ai_result.get("skills"):
            ai_skills = ai_result["skills"]
            for concept in ai_result.get("concepts", []):
                ai_skills.append({"name": concept, "category": "concept", "confidence": 0.6})
            print(f"  {repo['name']}: AI extracted {len(ai_skills)} additional skills")

        # ── Merge all extracted skills ──
        all_skills: Dict[str, Dict] = {}
        for s in directory_matches:
            key = s["name"].lower()
            if key not in all_skills:
                all_skills[key] = s
        for s in ai_skills:
            key = s["name"].lower()
            if key not in all_skills:
                all_skills[key] = s
            elif s.get("confidence", 0) > all_skills[key].get("confidence", 0):
                all_skills[key]["confidence"] = s["confidence"]

        # ── Register all extracted skills ──
        for skill_info in all_skills.values():
            skill_name = skill_info["name"]
            skill_id = skill_name.lower().replace(" ", "-").replace(".", "").replace("/", "")
            category = skill_info.get("category", "concept")
            confidence = skill_info.get("confidence", 0.5)

            register_skill(skill_id, skill_name, category, confidence, stars)

            links.append({
                "source": repo_id, "target": skill_id,
                "type": "USES", "strength": round(confidence, 2),
            })

            if lang:
                lang_id = lang.lower()
                if skill_id != lang_id:
                    links.append({
                        "source": lang_id, "target": skill_id,
                        "type": "USED_WITH", "strength": 0.5,
                    })

    # ── Pass 3: Create skill nodes with dynamic maturity ──
    for skill_id, info in skill_usage.items():
        maturity = compute_maturity(skill_id)
        add_node({
            "id": skill_id,
            "name": info["name"],
            "category": info["category"],
            "maturity": maturity,
            "market_demand": get_market_demand(info["name"]),
            "source": "github",
            "val": max(4, maturity / 10),
        })

    print(f"SYNC: done — {len(nodes)} nodes, {len(links)} links")
    return {"nodes": nodes, "links": links}
