from fastapi import APIRouter, HTTPException
from typing import Optional

from config import settings
from services import github_service, ai_service
from services.graph_service import get_graph, save_graph
from schemas.schemas import GitHubProfileRequest
from seed_data import DEMO_REPOS

router = APIRouter(tags=["github"])


@router.get("/repos")
async def get_repos(token: str = ""):
    """Fetch and return user's GitHub repositories with extracted skills."""
    if settings.demo_mode or not token:
        return {"repos": DEMO_REPOS, "source": "demo"}

    try:
        repos = await github_service.fetch_repos(token)
    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e))
    enriched = []
    for repo in repos[:20]:  # Limit to 20 repos
        owner = repo.get("owner", {}).get("login", "")
        name = repo.get("name", "")

        readme = await github_service.fetch_readme(token, owner, name)
        commits = await github_service.fetch_commit_count(token, owner, name)
        languages_raw = await github_service.fetch_languages(token, owner, name)
        languages = github_service.normalize_languages(languages_raw)

        # AI skill extraction
        extraction = ai_service.extract_skills(
            source_type="github",
            name=name,
            languages=languages,
            text=readme,
            commits=commits,
        )

        enriched.append({
            "name": name,
            "description": repo.get("description", ""),
            "languages": languages,
            "commits": commits,
            "stars": repo.get("stargazers_count", 0),
            "topics": repo.get("topics", []),
            "skills": extraction.get("skills", []),
            "domain": extraction.get("domain", ""),
        })

    return {"repos": enriched, "source": "github"}


from services.tech_directory import match_technologies, TECH_DIRECTORY
from services.market_data import get_market_demand


@router.post("/profile/analyze")
async def analyze_github_profile(payload: GitHubProfileRequest):
    """
    Fetch a GitHub user's full public profile and all repositories,
    build a multi-repo knowledge graph with per-repo source tagging.
    """
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="GitHub username is required.")

    token = (payload.token or settings.github_token or "").strip()

    try:
        # 1. Fetch profile info
        profile_info = await github_service.fetch_user_profile(username, token)

        # 2. Fetch all repos (public if no token, authenticated if token provided)
        repos_raw = await github_service.fetch_user_repos(username, token)

        # 3. Build enriched repo list + graph nodes
        all_nodes = []
        all_links = []
        enriched_repos = []

        for repo in repos_raw[:30]:  # cap at 30 repos
            owner = repo.get("owner", {}).get("login", username)
            name = repo.get("name", "")
            if not name:
                continue

            readme = await github_service.fetch_readme(token or "", owner, name)
            commits = await github_service.fetch_commit_count(token or "", owner, name)
            languages_raw = await github_service.fetch_languages(token or "", owner, name)
            languages = github_service.normalize_languages(languages_raw)
            stars = repo.get("stargazers_count", 0)
            topics = repo.get("topics", [])
            description = repo.get("description", "") or ""

            primary_lang = languages[0] if languages else (repo.get("language") or "")

            repo_node_id = f"repo:{name}"
            repo_node = {
                "id": repo_node_id,
                "name": name,
                "category": "repo",
                "source": "github",
                "repo": name,
                "repos": [name],
                "description": description,
                "stars": stars,
                "language": primary_lang,
                "maturity": min(100, commits * 2) if commits else 30,
                "market_demand": 70,
                "val": 8,
            }
            all_nodes.append(repo_node)

            def add_skill(skill_name: str, category: str, confidence: float = 0.8, link_type: str = "USES"):
                if not skill_name or not skill_name.strip():
                    return
                clean_name = skill_name.strip()
                skill_id = clean_name.lower().replace(" ", "-").replace(".", "").replace("/", "").replace("+", "p").replace("#", "sharp")

                existing = next((n for n in all_nodes if n["id"] == skill_id), None)
                if not existing:
                    all_nodes.append({
                        "id": skill_id,
                        "name": clean_name,
                        "category": category,
                        "source": "github",
                        "repo": name,
                        "repos": [name],
                        "maturity": min(100, int(confidence * 50) + (10 if stars > 0 else 0)),
                        "market_demand": get_market_demand(clean_name),
                        "val": 5,
                    })
                else:
                    if "repos" not in existing or not isinstance(existing["repos"], list):
                        existing["repos"] = [existing.get("repo", "")] if existing.get("repo") else []
                    if name not in existing["repos"]:
                        existing["repos"].append(name)

                # Check if link exists
                if not any(l["source"] == repo_node_id and l["target"] == skill_id for l in all_links):
                    all_links.append({
                        "source": repo_node_id,
                        "target": skill_id,
                        "type": link_type,
                        "strength": round(confidence, 2),
                    })

            # 1. Register all detected languages from GitHub API
            if isinstance(languages_raw, dict):
                for lang_name in languages_raw.keys():
                    lang_cat = TECH_DIRECTORY[lang_name][0] if lang_name in TECH_DIRECTORY else "language"
                    add_skill(lang_name, lang_cat, confidence=0.9, link_type="WRITTEN_IN")
            elif languages:
                for lang_name in languages:
                    lang_cat = TECH_DIRECTORY[lang_name][0] if lang_name in TECH_DIRECTORY else "language"
                    add_skill(lang_name, lang_cat, confidence=0.9, link_type="WRITTEN_IN")

            # 2. Register topics
            for topic in topics:
                topic_id = topic.lower().replace(" ", "-")
                canonical = topic.replace("-", " ").title()
                cat = "concept"
                for tech_name, (c, aliases) in TECH_DIRECTORY.items():
                    if topic_id in aliases or topic in aliases:
                        canonical = tech_name
                        cat = c
                        break
                add_skill(canonical, cat, confidence=0.8, link_type="TAGGED")

            # 3. Match technologies from TECH_DIRECTORY (README, description, topics, languages)
            combined_text = f"{description}\n{' '.join(topics)}\n{' '.join(languages)}\n{readme}"
            directory_matches = match_technologies(combined_text)
            for dm in directory_matches:
                add_skill(dm["name"], dm.get("category", "concept"), confidence=dm.get("confidence", 0.75), link_type="USES")

            # 4. AI skill extraction
            extraction = ai_service.extract_skills(
                source_type="github",
                name=name,
                languages=languages,
                text=combined_text,
                commits=commits,
            )

            for item in extraction.get("skills", []):
                if isinstance(item, dict):
                    s_name = item.get("name", "").strip()
                    s_cat = item.get("category") or extraction.get("domain", "concept")
                    s_conf = item.get("confidence", 0.75)
                else:
                    s_name = str(item).strip()
                    s_cat = extraction.get("domain", "concept")
                    s_conf = 0.75
                add_skill(s_name, s_cat, confidence=s_conf, link_type="USES")

            for concept in extraction.get("concepts", []):
                if isinstance(concept, str) and concept.strip():
                    add_skill(concept.strip(), "concept", confidence=0.7, link_type="USES")

            # Collect all skills associated with this repo
            repo_skills = [
                n["name"] for n in all_nodes
                if n.get("category") != "repo" and (
                    n.get("repo") == name or (isinstance(n.get("repos"), list) and name in n["repos"])
                )
            ]

            enriched_repos.append({
                "name": name,
                "description": description,
                "languages": languages,
                "commits": commits,
                "stars": stars,
                "topics": topics,
                "skills": repo_skills,
                "domain": extraction.get("domain", ""),
                "url": repo.get("html_url", ""),
            })

        save_graph(all_nodes, all_links)

        return {
            "status": "analyzed",
            "profile": profile_info,
            "repos": enriched_repos,
            "nodes": len(all_nodes),
            "links": len(all_links),
            "graph": {"nodes": all_nodes, "links": all_links},
        }

    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        print(f"ERROR: GitHub profile analysis failed: {e}")
        raise HTTPException(status_code=502, detail=f"GitHub profile analysis failed: {str(e)}")


@router.get("/user/{username}")
async def get_github_user_profile(username: str, token: Optional[str] = None):
    """Fetch basic GitHub user profile metadata."""
    resolved_token = (token or settings.github_token or "").strip()
    try:
        profile = await github_service.fetch_user_profile(username, resolved_token)
        return profile
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
