"""
Backward-compatible OpenRouter helper.

All provider routing now lives in services/llm_service.py, which supports
OpenRouter (hosted open-weight models) and Ollama (local inference).
"""

from services.llm_service import chat


def chat_openrouter(system_prompt: str, user_message: str, model: str = None) -> str:
    """Send a chat completion through the configured provider.

    The `model` argument is kept for API compatibility; the active model is
    configured with OPENROUTER_MODEL / OLLAMA_MODEL.
    """
    return chat(system_prompt, user_message)
