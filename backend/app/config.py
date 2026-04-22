"""
app/config.py
Centralised configuration loaded from environment variables / .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    #  Application 
    app_name: str = "Scan Info Tech"
    app_env: str = "production"
    debug: bool = False

    #  Database 
    database_url: str

    #  JWT 
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    #  Cloudinary 
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (parsed once at startup)."""
    return Settings()
