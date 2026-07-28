from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime

class User(Base):
    """
    User model representing a registered user in the platform.
    Pillar 1: Module by Responsibility (Data representation)
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
