from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import logging

from app.core.config import get_settings
from app.core.database import check_database


settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Minimal FastAPI service for pronunciation scoring and analytics expansion.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "ok",
    }


@app.get("/health")
def health() -> dict[str, object]:
    db_status = check_database()
    if db_status["status"] == "error":
        logger.warning("Health check: database error detected")
    return {
        "status": "ok" if db_status["status"] == "ok" else "degraded",
        "service": settings.app_name,
        "version": settings.app_version,
        "database": db_status["status"],
    }
