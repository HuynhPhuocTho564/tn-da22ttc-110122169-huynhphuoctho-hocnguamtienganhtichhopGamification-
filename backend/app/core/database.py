from collections.abc import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


settings = get_settings()

engine: Engine | None = None
SessionLocal: sessionmaker[Session] | None = None

if settings.database_url:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Iterator[Session]:
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database() -> dict[str, str]:
    if engine is None:
        return {
            "status": "not_configured",
            "message": "DATABASE_URL is not configured",
        }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "message": "Database connection is healthy",
        }
    except Exception:
        return {
            "status": "error",
            "message": "Database connection failed",
        }
