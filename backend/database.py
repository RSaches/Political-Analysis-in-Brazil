from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 5. Layered Configuration / Pillars: Using local SQLite for simplicity in MVP.
SQLALCHEMY_DATABASE_URL = "sqlite:///./olho_de_aguia.db"

# connect_args={"check_same_thread": False} is needed only for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency to get a DB session. Ensures the session is closed after use.
    (Pillar 4: Explicit Error Handling / Resource Management)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
