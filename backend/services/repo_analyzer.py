"""
Analyze a single public GitHub repository without authentication.
Uses the public GitHub API (60 req/hr unauthenticated).

Advanced approach:
1. Trust GitHub's language detection (most reliable signal)
2. Fetch actual dependency files (package.json, requirements.txt, etc.)
3. Parse real dependencies for high-confidence framework detection
4. Use README scanning only as a supplementary signal with cross-validation
"""

import re
import json
import httpx
from datetime import datetime
from typing import Dict, List, Any, Tuple, Set, Optional

from services.ai_service import extract_skills as ai_extract_skills
from services.tech_directory import match_technologies, TECH_DIRECTORY
from services.market_data import get_market_demand
from config import settings


GITHUB_API = "https://api.github.com"


def _github_headers() -> dict:
    """Build headers for GitHub API requests (authenticated if token available)."""
    headers = {"Accept": "application/vnd.github.mercy-preview+json"}
    if settings.github_token:
        headers["Authorization"] = f"token {settings.github_token}"
    return headers


def parse_github_url(url: str) -> Tuple[str, str]:
    """
    Extract owner and repo name from a GitHub URL.
    Supports: https://github.com/owner/repo, github.com/owner/repo, owner/repo
    """
    url = url.strip().rstrip("/")
    # Remove .git suffix if present
    if url.endswith(".git"):
        url = url[:-4]

    # Match github.com/owner/repo pattern
    match = re.match(r"(?:https?://)?(?:www\.)?github\.com/([^/]+)/([^/]+)", url)
    if match:
        return match.group(1), match.group(2)

    # Try owner/repo pattern directly
    match = re.match(r"^([^/]+)/([^/]+)$", url)
    if match:
        return match.group(1), match.group(2)

    raise ValueError(f"Invalid GitHub URL: {url}")


async def _fetch_repo_info(owner: str, repo: str) -> Dict:
    """Fetch public repo metadata, with actionable errors."""
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=_github_headers())

    if res.status_code == 200:
        return res.json()

    if res.status_code == 403 and res.headers.get("x-ratelimit-remaining") == "0":
        reset = res.headers.get("x-ratelimit-reset")
        when = ""
        if reset:
            try:
                when = datetime.fromtimestamp(int(reset)).strftime("%H:%M")
            except (ValueError, OSError):
                when = ""
        hint = (
            " Wait for the limit to reset"
            if settings.github_token
            else " Add GITHUB_TOKEN to backend/.env (a public-repo token raises the limit to 5,000/hour), or wait"
        )
        raise ValueError(
            f"GitHub API rate limit reached (60 requests/hour without a token)."
            f"{hint}{' — resets at ' + when if when else ''}."
        )

    if res.status_code == 404:
        raise ValueError(
            f"Repository not found or private: {owner}/{repo}. Check the URL and make sure the repo is public."
        )

    if res.status_code == 401:
        raise ValueError(
            "GitHub rejected the configured GITHUB_TOKEN. Check the token in backend/.env."
        )

    try:
        message = res.json().get("message", "")
    except Exception:
        message = ""
    raise ValueError(
        f"GitHub returned HTTP {res.status_code} for {owner}/{repo}"
        f"{': ' + message if message else '.'}"
    )


async def _fetch_readme_public(owner: str, repo: str) -> str:
    """Fetch raw README from a public repo."""
    headers = _github_headers()
    headers["Accept"] = "application/vnd.github.raw"
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        try:
            res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/readme", headers=headers)
            if res.status_code == 200:
                return res.text[:3000]
        except Exception:
            pass
    return ""


async def _fetch_languages_public(owner: str, repo: str) -> Dict:
    """Fetch language breakdown from a public repo."""
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        try:
            res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/languages", headers=_github_headers())
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass
    return {}


async def _fetch_file_content(owner: str, repo: str, path: str) -> str:
    """Fetch raw content of a specific file from a public repo. Returns '' if not found."""
    headers = _github_headers()
    headers["Accept"] = "application/vnd.github.raw"
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        try:
            res = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
                headers=headers,
            )
            if res.status_code == 200:
                return res.text[:5000]
        except Exception:
            pass
    return ""


def _parse_package_json(content: str) -> List[str]:
    """Extract dependency names from package.json content."""
    if not content:
        return []
    try:
        pkg = json.loads(content)
        deps = set()
        for key in ("dependencies", "devDependencies", "peerDependencies"):
            if key in pkg:
                deps.update(pkg[key].keys())
        return list(deps)
    except (json.JSONDecodeError, TypeError):
        return []


def _parse_requirements_txt(content: str) -> List[str]:
    """Extract package names from requirements.txt content."""
    if not content:
        return []
    deps = []
    for line in content.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        # Extract package name before ==, >=, <=, ~=, etc.
        name = re.split(r"[>=<!~\[]", line)[0].strip()
        if name:
            deps.append(name)
    return deps


# Map common npm/pip package names to canonical technology names
_PACKAGE_TO_TECH = {
    # npm / JS ecosystem
    "react": "React", "react-dom": "React", "next": "Next.js", "vue": "Vue.js",
    "nuxt": "Vue.js", "angular": "Angular", "@angular/core": "Angular",
    "svelte": "Svelte", "express": "Express.js", "fastify": "Fastify",
    "koa": "Koa", "hono": "Hono", "nestjs": "NestJS", "@nestjs/core": "NestJS",
    "tailwindcss": "Tailwind CSS", "axios": "Axios", "prisma": "Prisma",
    "@prisma/client": "Prisma", "mongoose": "Mongoose", "mongodb": "MongoDB",
    "pg": "PostgreSQL", "mysql2": "MySQL", "redis": "Redis", "ioredis": "Redis",
    "socket.io": "Socket.io", "graphql": "GraphQL", "@apollo/client": "GraphQL",
    "webpack": "Webpack", "vite": "Vite", "esbuild": "esbuild",
    "jest": "Jest", "vitest": "Vitest", "cypress": "Cypress",
    "typescript": "TypeScript", "three": "Three.js", "d3": "D3.js",
    "framer-motion": "Framer Motion", "gsap": "GSAP",
    "zustand": "Zustand", "redux": "Redux", "@reduxjs/toolkit": "Redux",
    "mobx": "MobX", "firebase": "Firebase", "supabase": "Supabase",
    "@supabase/supabase-js": "Supabase", "stripe": "Stripe",
    "sass": "Sass", "styled-components": "Styled Components",
    "storybook": "Storybook", "@storybook/react": "Storybook",
    "docker-compose": "Docker", "electron": "Electron",
    "react-native": "React Native", "expo": "React Native",
    "flutter": "Flutter", "chart.js": "Chart.js", "recharts": "Recharts",
    # pip / Python ecosystem
    "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
    "uvicorn": "FastAPI", "sqlalchemy": "SQLAlchemy", "alembic": "SQLAlchemy",
    "celery": "Celery", "redis": "Redis", "pymongo": "MongoDB",
    "psycopg2": "PostgreSQL", "psycopg2-binary": "PostgreSQL",
    "boto3": "AWS", "google-cloud-storage": "GCP",
    "tensorflow": "TensorFlow", "torch": "PyTorch", "pytorch": "PyTorch",
    "scikit-learn": "Scikit-learn", "pandas": "Pandas", "numpy": "NumPy",
    "keras": "Keras", "transformers": "Hugging Face", "langchain": "LangChain",
    "openai": "OpenAI API", "requests": "REST API",
    "httpx": "REST API", "pydantic": "Pydantic",
    "pytest": "Pytest", "gunicorn": "Gunicorn",
    "google-generativeai": "Gemini", "streamlit": "Streamlit",
    "gradio": "Gradio", "beautifulsoup4": "Web Scraping",
    "scrapy": "Web Scraping", "selenium": "Selenium",
    "pillow": "Image Processing", "opencv-python": "OpenCV",
    "matplotlib": "Matplotlib", "seaborn": "Data Visualization",
    "plotly": "Plotly", "dash": "Plotly Dash",
}


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


async def analyze_public_repo(
    url: str,
    engine: str = "orbitx",
    provider: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze a single public GitHub repo and return knowledge graph data.
    Returns { nodes: [...], links: [...] }

    Engine affects the AI extraction strictness:
      - orbitx: balanced extraction (confidence threshold 0.6)
      - gemini: conservative, strategic (confidence threshold 0.65)
      - grok: aggressive, catches more (confidence threshold 0.5)
    """
    # Engine-specific confidence thresholds
    _CONFIDENCE_THRESHOLDS = {"orbitx": 0.6, "gemini": 0.65, "grok": 0.5}
    min_confidence = _CONFIDENCE_THRESHOLDS.get(engine, 0.6)

    owner, repo_name = parse_github_url(url)
    print(f"ANALYZE: [{engine}/{provider or 'default'}] fetching {owner}/{repo_name}...")

    # ── Phase 1: Fetch all data from GitHub ──
    repo_info = await _fetch_repo_info(owner, repo_name)
    readme = await _fetch_readme_public(owner, repo_name)
    repo_languages = await _fetch_languages_public(owner, repo_name)

    # Fetch dependency files based on detected languages
    all_lang_names = list(repo_languages.keys())
    all_lang_lower = {l.lower() for l in all_lang_names}

    pkg_json = ""
    requirements = ""
    pyproject = ""

    # Try multiple paths for dependency files (monorepo support)
    _JS_PATHS = ["package.json", "frontend/package.json", "client/package.json", "app/package.json", "web/package.json"]
    _PY_PATHS = ["requirements.txt", "backend/requirements.txt", "server/requirements.txt", "api/requirements.txt"]
    _PYPROJECT_PATHS = ["pyproject.toml", "backend/pyproject.toml", "server/pyproject.toml"]

    if any(l in all_lang_lower for l in ("javascript", "typescript")):
        for path in _JS_PATHS:
            pkg_json = await _fetch_file_content(owner, repo_name, path)
            if pkg_json:
                print(f"  ANALYZE: found {path}")
                break

    if "python" in all_lang_lower:
        for path in _PY_PATHS:
            requirements = await _fetch_file_content(owner, repo_name, path)
            if requirements:
                print(f"  ANALYZE: found {path}")
                break
        if not requirements:
            for path in _PYPROJECT_PATHS:
                pyproject = await _fetch_file_content(owner, repo_name, path)
                if pyproject:
                    print(f"  ANALYZE: found {path}")
                    break

    stars = repo_info.get("stargazers_count", 0)
    forks = repo_info.get("forks_count", 0)
    description = repo_info.get("description") or ""
    topics = repo_info.get("topics", [])
    primary_lang = repo_info.get("language")

    nodes: List[Dict] = []
    links: List[Dict] = []
    seen_ids: set = set()
    skill_usage: Dict[str, Dict] = {}

    def register_skill(skill_id: str, name: str, category: str, confidence: float):
        if skill_id not in skill_usage:
            skill_usage[skill_id] = {
                "name": name, "category": category,
                "confidence": confidence, "count": 0, "total_stars": 0,
            }
        skill_usage[skill_id]["count"] += 1
        skill_usage[skill_id]["total_stars"] += stars
        if confidence > skill_usage[skill_id]["confidence"]:
            skill_usage[skill_id]["confidence"] = confidence

    def add_node(n: Dict):
        if n["id"] not in seen_ids:
            nodes.append(n)
            seen_ids.add(n["id"])

    def compute_maturity(skill_id: str) -> int:
        info = skill_usage.get(skill_id)
        if not info:
            return 50
        base = int(info["confidence"] * 50)
        usage_bonus = min(30, info["count"] * 10)
        star_bonus = min(20, info["total_stars"] * 3)
        return min(100, base + usage_bonus + star_bonus)

    # ── Phase 2: Create repo node ──
    repo_id = f"repo:{repo_name}"
    add_node({
        "id": repo_id,
        "name": repo_name,
        "category": "repo",
        "maturity": _maturity_from_stars(stars),
        "market_demand": min(100, 50 + stars * 2 + forks * 3),
        "source": "github",
        "val": max(4, min(15, 4 + stars * 0.5)),
    })

    # ── Phase 3: Register languages from GitHub API (HIGHEST CONFIDENCE) ──
    if primary_lang:
        lang_id = primary_lang.lower()
        lang_cat = TECH_DIRECTORY[primary_lang][0] if primary_lang in TECH_DIRECTORY else "language"
        register_skill(lang_id, primary_lang, lang_cat, 0.95)
        links.append({
            "source": repo_id, "target": lang_id,
            "type": "WRITTEN_IN", "strength": 0.95,
        })

    for rl in all_lang_names:
        rl_id = rl.lower()
        rl_cat = TECH_DIRECTORY[rl][0] if rl in TECH_DIRECTORY else "language"
        register_skill(rl_id, rl, rl_cat, 0.9)
        links.append({
            "source": repo_id, "target": rl_id,
            "type": "WRITTEN_IN", "strength": 0.85,
        })

    # ── Phase 4: Parse ACTUAL dependency files (HIGH CONFIDENCE) ──
    dep_skills: Set[str] = set()

    # Parse package.json
    npm_deps = _parse_package_json(pkg_json)
    if npm_deps:
        print(f"  ANALYZE: found {len(npm_deps)} npm dependencies")
    for dep in npm_deps:
        dep_lower = dep.lower()
        if dep_lower in _PACKAGE_TO_TECH:
            tech_name = _PACKAGE_TO_TECH[dep_lower]
            tech_id = tech_name.lower().replace(" ", "-").replace(".", "")
            # Look up category from TECH_DIRECTORY or default
            category = "concept"
            for canonical, (cat, _) in TECH_DIRECTORY.items():
                if canonical.lower() == tech_name.lower():
                    category = cat
                    break
            register_skill(tech_id, tech_name, category, 0.9)
            dep_skills.add(tech_id)
            links.append({
                "source": repo_id, "target": tech_id,
                "type": "DEPENDS_ON", "strength": 0.9,
            })

    # Parse requirements.txt / pyproject.toml
    pip_deps = _parse_requirements_txt(requirements)
    if not pip_deps and pyproject:
        # Basic pyproject.toml dependency extraction
        for line in pyproject.split("\n"):
            line = line.strip().strip('"').strip("'").strip(",")
            dep_name = re.split(r"[>=<!~\[]", line)[0].strip()
            if dep_name and dep_name.replace("-", "").replace("_", "").isalnum():
                pip_deps.append(dep_name)

    if pip_deps:
        print(f"  ANALYZE: found {len(pip_deps)} pip dependencies")
    for dep in pip_deps:
        dep_lower = dep.lower().replace("_", "-")
        if dep_lower in _PACKAGE_TO_TECH:
            tech_name = _PACKAGE_TO_TECH[dep_lower]
            tech_id = tech_name.lower().replace(" ", "-").replace(".", "")
            category = "concept"
            for canonical, (cat, _) in TECH_DIRECTORY.items():
                if canonical.lower() == tech_name.lower():
                    category = cat
                    break
            register_skill(tech_id, tech_name, category, 0.9)
            dep_skills.add(tech_id)
            links.append({
                "source": repo_id, "target": tech_id,
                "type": "DEPENDS_ON", "strength": 0.9,
            })

    # ── Phase 5: Register topics (MEDIUM CONFIDENCE) ──
    for topic in topics:
        topic_id = topic.lower().replace(" ", "-")
        canonical = topic.replace("-", " ").title()
        category = "concept"
        for tech_name, (cat, aliases) in TECH_DIRECTORY.items():
            if topic_id in aliases or topic in aliases:
                canonical = tech_name
                category = cat
                break
        register_skill(topic_id, canonical, category, 0.75)
        links.append({
            "source": repo_id, "target": topic_id,
            "type": "TAGGED", "strength": 0.8,
        })

    # ── Phase 6: README tech scanning ──
    # When dependency files were found → strict mode (devops/database only from README)
    # When NO dependency files found → fallback mode (allow all categories from README)
    combined_text = f"{description}\n{' '.join(topics)}\n{readme}"
    directory_matches = match_technologies(combined_text)

    # Set of programming languages — ONLY trust GitHub's API for these
    _PROGRAMMING_LANGUAGES = {
        "python", "java", "kotlin", "swift", "c++", "c#", "c", "go", "rust",
        "ruby", "php", "scala", "dart", "lua", "r", "julia", "perl", "elixir",
        "haskell", "clojure", "shell", "powershell", "solidity",
        "javascript", "typescript", "coffeescript", "objective-c",
    }

    has_dep_files = len(dep_skills) > 0
    if has_dep_files:
        # STRICT: deps were found, README only adds infra tools
        _README_ALLOWED_CATEGORIES = {"devops", "database"}
        print(f"  ANALYZE: STRICT mode — {len(dep_skills)} deps found, README limited to devops/database")
    else:
        # FALLBACK: no deps found, allow README to contribute everything except languages
        _README_ALLOWED_CATEGORIES = {"frontend", "backend", "devops", "database", "ml", "mobile", "concept"}
        print(f"  ANALYZE: FALLBACK mode — no dep files found, README allowed for all categories")

    print(f"  ANALYZE: directory matched {len(directory_matches)} technologies from text")

    for s in directory_matches:
        skill_name = s["name"]
        skill_id = skill_name.lower().replace(" ", "-").replace(".", "").replace("/", "")
        category = s.get("category", "concept")

        # Skip if already registered (from languages or dependency files)
        if skill_id in dep_skills or skill_id in {l.lower() for l in all_lang_names}:
            continue

        # NEVER add programming languages from README
        if skill_id in _PROGRAMMING_LANGUAGES:
            continue

        # Category filter (strict or fallback depending on dep files)
        if category not in _README_ALLOWED_CATEGORIES:
            continue

        confidence = s.get("confidence", 0.5)
        register_skill(skill_id, skill_name, category, confidence)
        links.append({
            "source": repo_id, "target": skill_id,
            "type": "USES", "strength": round(confidence, 2),
        })

    # ── Phase 7: AI extraction (CONCEPTS ONLY) ──
    # AI can hallucinate specific technologies. We ONLY allow it to add "concept"
    # category skills (e.g., "Authentication", "Real-time", "API Design").
    # All specific tech (frameworks, libraries, etc.) must come from Phases 3-4.
    ai_result = ai_extract_skills(
        source_type="github",
        name=repo_name,
        languages=all_lang_names if all_lang_names else ([primary_lang] if primary_lang else []),
        text=combined_text,
        commits=repo_info.get("open_issues_count", 0),
        provider=provider,
    )

    if ai_result and ai_result.get("skills"):
        ai_skills = ai_result["skills"]
        for concept in ai_result.get("concepts", []):
            ai_skills.append({"name": concept, "category": "concept", "confidence": 0.7})

        accepted = 0
        for s in ai_skills:
            skill_name = s["name"]
            skill_id = skill_name.lower().replace(" ", "-").replace(".", "").replace("/", "")
            category = s.get("category", "concept")
            confidence = s.get("confidence", 0.5)

            # Skip if already registered
            if skill_id in skill_usage:
                continue

            # STRICT: AI can ONLY add concepts — nothing else
            if category != "concept":
                continue

            # Skip programming languages
            if skill_id in _PROGRAMMING_LANGUAGES:
                continue

            # Confidence filter
            if confidence < min_confidence:
                continue

            register_skill(skill_id, skill_name, "concept", confidence)
            links.append({
                "source": repo_id, "target": skill_id,
                "type": "USES", "strength": round(confidence, 2),
            })
            accepted += 1

        print(f"  ANALYZE: AI accepted {accepted} concept skills (filtered rest)")

    # ── Phase 8: Create skill nodes with dynamic maturity ──
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

    print(f"ANALYZE: done — {len(nodes)} nodes, {len(links)} links")
    return {"nodes": nodes, "links": links}
