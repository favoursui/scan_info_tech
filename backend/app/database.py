"""
app/database.py
SQLAlchemy async-compatible session factory and declarative base.
"""
import logging
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


#  Engine 
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,       # detect stale connections
    echo=False,               # set True only for SQL debugging
)


# Ensure UTF-8 charset on every new connection (MySQL only)
if "mysql" in settings.database_url:
    @event.listens_for(engine, "connect")
    def set_charset(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("SET NAMES utf8mb4")
        cursor.close()


#  Session 
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


#  Base 
Base = declarative_base()


#  Dependency 
def get_db():
    """FastAPI dependency — yields a DB session and guarantees cleanup."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def check_db_connection() -> bool:
    """Health-check helper: returns True if database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        return False
