import hashlib
import json
from typing import Dict, List, Optional

from config import settings
from services import cache_service
from services import llm_service

_CACHE_TTL = 60 * 60 * 24  # 24 hours


def _key(prefix: str, *parts) -> str:
    raw = "|".join(str(p) for p in parts)
    return f"{prefix}:{hashlib.sha256(raw.encode('utf-8')).hexdigest()}"


def _strip_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    # Some models prepend prose ("Here is the JSON:") — keep the object only.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        text = text[start:end + 1]
    return text.strip()


def _ai_enabled(provider: Optional[str] = None) -> bool:
    return not settings.demo_mode and llm_service.is_available(provider)


# ═══════════════════════════════════════════════════════════
#  SKILL EXTRACTION
# ═══════════════════════════════════════════════════════════

def extract_skills(
    source_type: str,
    name: str,
    languages: list,
    text: str,
    commits: int = 0,
    provider: Optional[str] = None,
) -> dict:
    """Extract skills from content using the selected open-weight engine."""
    cache_key = _key(
        "extract",
        llm_service.resolve_provider(provider),
        source_type,
        name,
        ",".join(sorted(languages or [])),
        text[:2000],
        commits,
    )
    cached = cache_service.get_json(cache_key)
    if cached is not None:
        return cached

    if not _ai_enabled(provider):
        return _mock_extraction(name, languages)

    prompt = f"""Analyze a {source_type} project and extract technologies, frameworks, and libraries that are ACTUALLY USED in this project.

Project: {name}
Languages detected: {languages}
Content (README + description):
\"\"\"
{text[:2000]}
\"\"\"
Activity: {commits} recent commits

STRICT RULES:
1. ONLY extract technologies that are CLEARLY AND EXPLICITLY mentioned as being used in this project.
2. DO NOT infer or guess technologies that are merely referenced in comparisons, alternatives, or "see also" sections.
3. If the README says "unlike Express" or "alternative to Django", do NOT extract Express or Django — those are comparisons, not actual usage.
4. Look for: "Built with", import statements, package.json/requirements.txt dependencies, Dockerfile references, config files mentioned, badges.
5. The detected languages list is RELIABLE — include those. But only add frameworks if there's clear evidence they're used.
6. Extract 3 to 12 skills — quality over quantity. Only include things you're confident about.
7. category MUST be one of: frontend, backend, ml, devops, database, mobile, concept
8. confidence is 0.5 to 1.0 — use 0.5 for loosely mentioned, 0.9+ for clearly core technologies

Return ONLY this JSON, no explanation, no markdown fences:
{{"skills": [{{"name": "string", "category": "string", "confidence": 0.0}}], "concepts": ["string"], "domain": "string"}}
"""

    result_text = llm_service.chat(
        "You are a precise developer-tools analyst. Return only valid JSON.",
        prompt,
        temperature=0.2,
        max_tokens=800,
        json_mode=True,
        provider=provider,
    )
    if not result_text:
        return _mock_extraction(name, languages)

    try:
        result = json.loads(_strip_json(result_text))
        if not isinstance(result.get("skills"), list):
            raise ValueError("missing skills list")
        print(f"  AI extracted: {[s.get('name') for s in result.get('skills', [])]}")
        cache_service.set_json(cache_key, result, ttl=_CACHE_TTL)
        return result
    except Exception as e:
        print(f"  WARN: AI extraction failed: {e}")
        return _mock_extraction(name, languages)


# ═══════════════════════════════════════════════════════════
#  GAP EXPLANATIONS
# ═══════════════════════════════════════════════════════════

def _default_gap_explanation(skill_name: str, target_role: str) -> str:
    return (
        f"{skill_name} is commonly required for {target_role} roles "
        f"and would strengthen your profile."
    )


def generate_gap_explanation(skill_name: str, target_role: str, provider: Optional[str] = None) -> str:
    """Generate a one-sentence explanation of why a skill matters for a role."""
    return generate_gap_explanations([skill_name], target_role, provider=provider).get(
        skill_name, _default_gap_explanation(skill_name, target_role)
    )


def generate_gap_explanations(
    skills: List[str],
    target_role: str,
    provider: Optional[str] = None,
) -> Dict[str, str]:
    """Explain several gaps with at most ONE model call.

    Cached per skill and engine, so repeated readiness requests cost nothing.
    """
    if not skills:
        return {}

    engine = llm_service.resolve_provider(provider)
    explanations: Dict[str, str] = {}
    missing: List[str] = []
    for skill in skills:
        cached = cache_service.get(f"gap:{engine}:{skill.lower()}:{target_role.lower()}")
        if cached:
            explanations[skill] = cached
        else:
            missing.append(skill)

    if not missing:
        return explanations

    if not _ai_enabled(provider):
        for skill in missing:
            explanations[skill] = _default_gap_explanation(skill, target_role)
        return explanations

    prompt = f"""A developer is targeting the role: {target_role}.
For each skill below, write ONE direct, practical sentence explaining why it matters for that role.

Skills: {json.dumps(missing)}

Return ONLY valid JSON, no markdown, in this exact shape:
{{"explanations": {{"SkillName": "one sentence", "...": "..."}}}}
"""

    result_text = llm_service.chat(
        "You are a concise developer career coach. Return only valid JSON.",
        prompt,
        temperature=0.4,
        max_tokens=600,
        json_mode=True,
        provider=provider,
    )

    parsed = {}
    if result_text:
        try:
            parsed = json.loads(_strip_json(result_text)).get("explanations", {})
        except Exception as e:
            print(f"  WARN: AI gap explanations failed: {e}")

    for skill in missing:
        text = parsed.get(skill) or _default_gap_explanation(skill, target_role)
        explanations[skill] = text
        if result_text:
            cache_service.set(f"gap:{engine}:{skill.lower()}:{target_role.lower()}", text, ttl=_CACHE_TTL)

    return explanations


# ═══════════════════════════════════════════════════════════
#  CAREER ROADMAP
# ═══════════════════════════════════════════════════════════

def generate_career_roadmap(
    current_skills: List[str],
    target_role: str,
    gaps: List[Dict],
    provider: Optional[str] = None,
) -> dict:
    """Generate a learning roadmap for a target career role."""
    engine = llm_service.resolve_provider(provider)
    cache_key = _key(
        "roadmap",
        engine,
        target_role,
        ",".join(sorted(current_skills)),
        ",".join(sorted(g["skill"] for g in gaps)),
    )
    cached = cache_service.get_json(cache_key)
    if cached is not None:
        return cached

    if not _ai_enabled(provider):
        return _mock_roadmap(target_role, gaps)

    prompt = f"""
A student wants to become a {target_role}.
Their current skills: {current_skills}
Their skill gaps: {[g['skill'] for g in gaps]}

Generate a learning roadmap as JSON:
{{
  "phases": [
    {{
      "title": "Phase name",
      "duration": "estimated time",
      "skills": ["skill1", "skill2"],
      "resources": ["course or resource name"]
    }}
  ],
  "total_duration": "X months",
  "career_readiness_after": 85
}}

Return ONLY JSON, no explanation, no markdown. Generate 3-4 phases.
"""

    result_text = llm_service.chat(
        "You are a developer career planner. Return only valid JSON.",
        prompt,
        temperature=0.5,
        max_tokens=900,
        json_mode=True,
        provider=provider,
    )
    if not result_text:
        return _mock_roadmap(target_role, gaps)

    try:
        result = json.loads(_strip_json(result_text))
        cache_service.set_json(cache_key, result, ttl=_CACHE_TTL)
        return result
    except Exception:
        return _mock_roadmap(target_role, gaps)


def _mock_extraction(name: str, languages: list) -> dict:
    """Fallback mock extraction when the model is unavailable."""
    lang_skill_map = {
        "JavaScript": {"name": "JavaScript", "category": "frontend", "confidence": 0.95},
        "TypeScript": {"name": "TypeScript", "category": "frontend", "confidence": 0.92},
        "Python":     {"name": "Python",     "category": "backend",  "confidence": 0.95},
        "CSS":        {"name": "CSS",        "category": "frontend", "confidence": 0.85},
        "Node.js":    {"name": "Node.js",    "category": "backend",  "confidence": 0.88},
        "Jupyter":    {"name": "Jupyter",    "category": "ml",       "confidence": 0.80},
        "React":      {"name": "React",      "category": "frontend", "confidence": 0.90},
        "FastAPI":    {"name": "FastAPI",    "category": "backend",  "confidence": 0.88},
        "HTML":       {"name": "HTML",       "category": "frontend", "confidence": 0.90},
        "Jupyter Notebook": {"name": "Jupyter", "category": "ml",   "confidence": 0.80},
    }
    skills = [lang_skill_map[lang] for lang in languages if lang in lang_skill_map]
    return {"skills": skills, "concepts": [], "domain": "fullstack"}


def _mock_roadmap(target_role: str, gaps: List[Dict]) -> dict:
    """Fallback mock roadmap data."""
    return {
        "phases": [
            {
                "title": "Foundation",
                "duration": "4 weeks",
                "skills": [g["skill"] for g in gaps[:2]] if gaps else ["Python"],
                "resources": [
                    "Coursera ML Specialization",
                    "Fast.ai Practical Deep Learning",
                ],
            },
            {
                "title": "Core Skills",
                "duration": "8 weeks",
                "skills": [g["skill"] for g in gaps[1:3]] if len(gaps) > 1 else ["PyTorch"],
                "resources": [
                    "PyTorch Official Tutorials",
                    "Kaggle Competitions",
                ],
            },
            {
                "title": "Production & Deployment",
                "duration": "4 weeks",
                "skills": ["Docker", "MLOps", "CI/CD"],
                "resources": [
                    "Docker Mastery on Udemy",
                    "MLOps Zoomcamp",
                ],
            },
        ],
        "total_duration": "4 months",
        "career_readiness_after": 82,
    }


# ═══════════════════════════════════════════════════════════
#  OFF-TOPIC VALIDATION
# ═══════════════════════════════════════════════════════════

_OFF_TOPIC_KEYWORDS = [
    "recipe", "cook", "food", "restaurant", "meal", "diet", "workout", "gym",
    "movie", "film", "series", "netflix", "music", "song", "lyrics",
    "politics", "election", "government", "president", "war", "country",
    "relationship", "girlfriend", "boyfriend", "dating", "love",
    "sports", "football", "cricket", "tennis", "basketball",
    "weather", "horoscope", "astrology", "religion", "god",
    "homework", "essay", "history", "geography", "biology", "chemistry",
    "stock market", "crypto", "bitcoin", "investment", "money",
]


def _is_off_topic(message: str) -> bool:
    """Fast check: is this message clearly off-topic for a tech career coach?"""
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in _OFF_TOPIC_KEYWORDS)
