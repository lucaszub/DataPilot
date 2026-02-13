from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://datapilot:password@postgres:5432/datapilot"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-5-20250929"
    fernet_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
