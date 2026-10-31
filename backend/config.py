from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Open-weight AI (OpenRouter) ──
    ai_provider: str = "openrouter"  # "openrouter" | "ollama"
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemma-4-26b-a4b-it:free"
    # Comma-separated free models tried in order when the primary is rate-limited
    # or returns no content.
    openrouter_fallback_models: str = "xingchen-agi/xing4.0-29b-a4b:free,liquid/lfm-2.5-2.6b:free"

    # ── Local inference (Ollama) ──
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b-instruct"
    ollama_api_key: str = ""  # only needed for https://ollama.com cloud models

    github_client_id: str = ""
    github_client_secret: str = ""
    github_token: str = ""
    notion_token: str = ""
    neo4j_uri: str = ""
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    jwt_secret: str = "changeme"
    demo_mode: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
