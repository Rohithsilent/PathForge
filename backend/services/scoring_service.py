from typing import List, Dict, Optional


# Words that are not technologies. Without this guard a placeholder like
# "anything" gets a fabricated score boost from the model's default optimism.
_NON_SKILL_WORDS = {
    "anything", "something", "whatever", "nothing", "test", "testing",
    "asdf", "asdfgh", "foo", "bar", "baz", "hello", "hi", "yes", "no",
    "none", "random", "stuff", "things", "skills", "tech", "magic",
}


def skill_maturity(
    commit_recency: float,
    commit_frequency: float,
    project_diversity: float,
    co_occurrence: float,
    ai_confidence: float,
) -> float:
    """
    Calculate skill maturity score (0-100).
    All inputs normalised 0.0 to 1.0.
    """
    return round(
        (
            commit_recency * 0.20
            + commit_frequency * 0.20
            + project_diversity * 0.20
            + co_occurrence * 0.20
            + ai_confidence * 0.20
        )
        * 100,
        1,
    )


def career_readiness(
    skill_coverage: float,
    avg_maturity: float,
    market_alignment: float,
    project_depth: float,
) -> float:
    """
    Calculate career readiness score (0-100).
    All inputs normalised 0.0 to 1.0.
    """
    return round(
        (
            skill_coverage * 0.40
            + avg_maturity * 0.30
            + market_alignment * 0.20
            + project_depth * 0.10
        )
        * 100,
        1,
    )


def gap_priority(
    career_weight: float,
    demand_weight: float,
    missing_severity: float,
) -> float:
    """Calculate gap priority as weighted product of three factors."""
    return round(career_weight * demand_weight * missing_severity, 3)


def whatif_simulation(
    current_score: float,
    simulated_skills: list,
    graph_context: str = "",
    engine: str = "orbitx",
    provider: Optional[str] = None,
) -> dict:
    """
    Simulate adding skills using AI. Engine affects the tone of the reason.
    Falls back to heuristics if API is unavailable.
    """
    from services.ai_service import _is_off_topic
    from services import llm_service
    import json

    # 1. Validation: If any skill is clearly off-topic (like cooking), reject it.
    if any(_is_off_topic(s) for s in simulated_skills):
        return {
            "original_score": current_score,
            "new_score": current_score,
            "score_delta": 0,
            "simulated_skills": simulated_skills,
            "reason": "Wait, what? I only handle tech and developer career questions. I'm not a cooking or life coach! 🚫",
        }

    # Placeholders like "anything" are not technologies — never invent a boost.
    if simulated_skills and all(s.strip().lower() in _NON_SKILL_WORDS for s in simulated_skills):
        return {
            "original_score": current_score,
            "new_score": current_score,
            "score_delta": 0,
            "simulated_skills": simulated_skills,
            "reason": f"{', '.join(simulated_skills)} isn't a recognized technology, so it wouldn't change your readiness score. Try a real skill like Docker or TypeScript.",
        }

    skill_list = ", ".join(simulated_skills)

    # Engine-specific tone instructions
    tone_map = {
        "orbitx": "Be precise, data-driven, and professional. Reference specific numbers.",
        "gemini": "Be thoughtful and strategic. Explain how this skill connects to their broader career architecture.",
        "grok": "Be brutally honest, blunt, and use casual language. No sugarcoating — tell them the harsh truth about why this matters or doesn't.",
    }
    tone = tone_map.get(engine, tone_map["orbitx"])

    prompt = f"""You are a developer career analyst. A developer has these skills:

{graph_context}

Their current career readiness score is {current_score:.0f}/100.

Question: If they learned {skill_list}, how much would their career readiness score improve?

STRICT RULES:
1. ONLY analyze technology, programming, or professional developer skills.
2. If the user asks about non-tech skills (cooking, sports, etc.), set score_delta to 0 and explain that you only handle tech career growth.
3. Be realistic. Most single skills boost score by 3-12 points depending on demand and relevance.
4. Consider their existing skills — if they already know related tech, the boost is smaller.
5. If a skill is not a real, recognizable technology or programming skill (e.g. "anything", "asdfgh"), set score_delta to 0.
6. Tone: {tone}

Return ONLY this JSON, no markdown, no explanation outside it:
{{"score_delta": <number 0-15>, "reason": "<1-2 sentence explanation referencing their actual skills>"}}"""

    # ── OPEN-WEIGHT MODEL → configured provider (OpenRouter or Ollama) ──
    if graph_context and llm_service.is_available(provider):
        result_text = llm_service.chat(
            "You are a developer career analyst. Return ONLY JSON.",
            prompt,
            temperature=0.4,
            max_tokens=300,
            json_mode=True,
            provider=provider,
        )
        if result_text:
            try:
                text = result_text.strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                start, end = text.find("{"), text.rfind("}")
                if start != -1 and end > start:
                    text = text[start:end + 1]

                parsed = json.loads(text.strip())
                try:
                    delta = float(parsed.get("score_delta", 0))
                except (TypeError, ValueError):
                    delta = 0.0
                delta = max(0.0, min(15.0, delta))
                reason = parsed.get("reason", "")
                new_score = min(100, round(current_score + delta, 1))
                return {
                    "original_score": round(current_score, 1),
                    "new_score": new_score,
                    "score_delta": round(delta, 1),
                    "simulated_skills": simulated_skills,
                    "reason": reason,
                }
            except Exception as e:
                print(f"WARN: {engine} whatif failed: {e}")

    # --- Heuristic fallback ---
    boost = 0.0
    unknown: list[str] = []
    for skill in simulated_skills:
        skill_lower = skill.lower()
        if skill_lower in ["pytorch", "tensorflow", "scikit-learn", "keras"]:
            boost += 0.06
        elif skill_lower in ["docker", "kubernetes", "aws", "gcp", "azure"]:
            boost += 0.04
        elif skill_lower in ["react", "vue", "angular", "nextjs", "next.js"]:
            boost += 0.03
        elif skill_lower in ["system design", "distributed systems", "microservices"]:
            boost += 0.05
        else:
            unknown.append(skill)

    new_score = min(100, round(current_score + (boost * 100), 1))
    delta = round(new_score - current_score, 1)

    if boost == 0:
        reason = f"No reliable estimate for {skill_list} — try a recognized technology."
    else:
        reason = f"Fallback calculation: Adding {skill_list} improves your stack depth."

    return {
        "original_score": round(current_score, 1),
        "new_score": new_score,
        "score_delta": delta,
        "simulated_skills": simulated_skills,
        "reason": reason,
    }
