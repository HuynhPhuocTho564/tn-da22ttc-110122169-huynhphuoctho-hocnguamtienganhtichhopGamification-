import os
from dataclasses import dataclass


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Web_HoTroPhatAmEN API"
    app_version: str = "0.1.0"
    environment: str = "development"
    database_url: str | None = None
    cors_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3010",
        "http://127.0.0.1:3010",
    )


def get_settings() -> Settings:
    cors_value = os.getenv("CORS_ORIGINS", "")
    cors_origins = tuple(_split_csv(cors_value)) if cors_value else Settings.cors_origins

    return Settings(
        app_name=os.getenv("APP_NAME", Settings.app_name),
        app_version=os.getenv("APP_VERSION", Settings.app_version),
        environment=os.getenv("APP_ENV", Settings.environment),
        database_url=os.getenv("DATABASE_URL") or None,
        cors_origins=cors_origins,
    )
