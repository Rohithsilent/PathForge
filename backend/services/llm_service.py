"""
Unified LLM provider.

AI_PROVIDER selects where inference runs:
  - "openrouter" (default): hosted open-weight models via OpenRouter
  - "ollama": local inference on the user's own machine

Both paths are OpenAI-style chat APIs. No keys or prompts containing secrets
are ever logged.
"""

import time
from typing import Optional

import httpx

from config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def resolve_provider(provider: Optional[str] = None) -> str:
    """Pick the requested provider, falling back to AI_PROVIDER.

    Only two engines are supported: local Ollama and hosted OpenRouter.
    """
    value = (provider or settings.ai_provider or "openrouter").strip().lower()
    return "ollama" if value == "ollama" else "openrouter"


def active_provider() -> str:
    return resolve_provider(None)


def active_model(provider: Optional[str] = None) -> str:
    if resolve_provider(provider) == "ollama":
        return settings.ollama_model
    return settings.openrouter_model


def _is_ollama_cloud() -> bool:
    return settings.ollama_base_url.rstrip("/").startswith("https://ollama.com")


def _openrouter_models() -> list[str]:
    """Primary model followed by any configured fallbacks, de-duplicated."""
    models = [settings.openrouter_model]
    for name in (settings.openrouter_fallback_models or "").split(","):
        name = name.strip()
        if name and name not in models:
            models.append(name)
    return models


_ollama_status_cache = {"time": 0.0, "status": False}


def _is_local_ollama_alive() -> bool:
    now = time.time()
    if now - _ollama_status_cache["time"] < 10.0:
        return _ollama_status_cache["status"]

    alive = False
    try:
        with httpx.Client(timeout=0.4) as client:
            res = client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
            alive = (res.status_code == 200)
    except Exception:
        alive = False

    _ollama_status_cache["time"] = now
    _ollama_status_cache["status"] = alive
    return alive


def is_available(provider: Optional[str] = None) -> bool:
    """Check if the selected provider is configured and available."""
    if resolve_provider(provider) == "ollama":
        if _is_ollama_cloud():
            return bool(settings.ollama_api_key)
        return _is_local_ollama_alive()
    return bool(settings.openrouter_api_key)


def _provider_info(provider: str) -> dict:
    if provider == "ollama":
        return {
            "id": "ollama",
            "label": "Ollama",
            "model": settings.ollama_model,
            "available": is_available("ollama"),
            "local": not _is_ollama_cloud(),
            "cloud": _is_ollama_cloud(),
            "base_url": settings.ollama_base_url,
        }
    return {
        "id": "openrouter",
        "label": "OpenRouter",
        "model": settings.openrouter_model,
        "available": is_available("openrouter"),
        "local": False,
        "cloud": True,
        "base_url": "openrouter.ai",
    }


def status() -> dict:
    data = {
        "provider": active_provider(),
        "model": active_model(),
        "open_weights": True,
        "local": active_provider() == "ollama" and not _is_ollama_cloud(),
        "cloud": active_provider() == "ollama" and _is_ollama_cloud(),
        "base_url": settings.ollama_base_url if active_provider() == "ollama" else "openrouter.ai",
    }
    if active_provider() != "ollama":
        data["fallback_models"] = _openrouter_models()[1:]
    # Exactly two selectable engines: one model each.
    data["providers"] = [_provider_info("ollama"), _provider_info("openrouter")]
    return data


def _request_with_retry(
    url: str,
    payload: dict,
    headers: Optional[dict] = None,
    timeout: float = 60.0,
    max_attempts: int = 3,
) -> Optional[dict]:
    last_error = None
    for attempt in range(max_attempts):
        try:
            with httpx.Client(timeout=timeout) as client:
                res = client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                return res.json()
            if res.status_code in (429, 500, 502, 503, 504):
                last_error = f"HTTP {res.status_code}"
            else:
                print(f"WARN: LLM provider returned {res.status_code}: {res.text[:200]}")
                return None
        except Exception as exc:  # network errors, timeouts
            last_error = str(exc)
            # If the service is not running or actively refusing connection, don't stall with retries
            if "Connection refused" in last_error or "ConnectError" in type(exc).__name__:
                return None
        if attempt < max_attempts - 1:
            time.sleep(2 ** attempt)
    print(f"WARN: LLM request failed after retries: {last_error}")
    return None


def _chat_openrouter(
    system_prompt: str,
    user_message: str,
    temperature: float,
    max_tokens: int,
    json_mode: bool = False,
) -> Optional[str]:
    if not settings.openrouter_api_key:
        return None

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "PathForge",
    }

    models = _openrouter_models()
    for model in models:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        # With fallbacks available, don't burn retries on the same rate-limited
        # model — move to the next one instead.
        data = _request_with_retry(
            OPENROUTER_URL,
            payload,
            headers=headers,
            max_attempts=2 if len(models) == 1 else 1,
        )
        if not data:
            continue
        try:
            content = data["choices"][0]["message"].get("content")
        except (KeyError, IndexError, TypeError, AttributeError):
            print(f"WARN: Unexpected OpenRouter response shape from {model}")
            continue
        if content and content.strip():
            return content.strip()
        print(f"WARN: Empty content from {model} (reasoning-only response)")
    return None


def _chat_ollama(
    system_prompt: str,
    user_message: str,
    temperature: float,
    max_tokens: int,
    json_mode: bool = False,
) -> Optional[str]:
    if not is_available("ollama"):
        return None
    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
        "options": {"temperature": temperature, "num_predict": max_tokens},
    }
    if json_mode:
        payload["format"] = "json"

    headers = {}
    if _is_ollama_cloud() and settings.ollama_api_key:
        headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

    # Local models can be slow on first load — allow a generous timeout.
    data = _request_with_retry(url, payload, headers=headers, timeout=180.0)
    if not data:
        return None
    try:
        return data["message"]["content"].strip()
    except (KeyError, TypeError):
        print("WARN: Unexpected Ollama response shape")
        return None


def chat(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    json_mode: bool = False,
    provider: Optional[str] = None,
) -> Optional[str]:
    """Send a chat completion to the requested (or configured) provider.

    json_mode asks the provider to constrain output to valid JSON (used by
    extraction, gap, roadmap and what-if calls).
    Returns None when the provider is unavailable; callers fall back to
    deterministic local heuristics.
    """
    if resolve_provider(provider) == "ollama":
        return _chat_ollama(system_prompt, user_message, temperature, max_tokens, json_mode)
    return _chat_openrouter(system_prompt, user_message, temperature, max_tokens, json_mode)
