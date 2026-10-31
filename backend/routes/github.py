from fastapi import APIRouter, HTTPException

from config import settings
from services import github_service, ai_service
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
