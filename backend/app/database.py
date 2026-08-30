import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/workout_tracker")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine,
)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

