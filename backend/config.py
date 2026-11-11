from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Open-weight AI (OpenRouter) ──
    ai_provider: str = "openrouter"  # "openrouter" | "ollama"
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemma-4-26b-a4b-it:free"
    # Comma-separated free models tried in order when the primary is rate-limited
    # or returns no content.
    openrouter_fallback_models: str = (
        "nvidia/nemotron-3-ultra-550b-a55b:free,"
        "openrouter/free,"
        "liquid/lfm-2.5-2.6b:free,"
        "google/gemma-4-31b-it:free"
    )

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

    # Firebase
    firebase_credentials_path: str = ""  # path to serviceAccountKey.json
    firebase_service_account_json: str = ""  # raw service account JSON string (ideal for Render env var)
    # If empty, Firebase token verification is skipped (dev mode)

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
