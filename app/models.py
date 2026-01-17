from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    family_members = relationship("FamilyMember", back_populates="owner")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(20))
    birth_date = Column(Date, nullable=True)
    death_date = Column(Date, nullable=True)
    birth_place = Column(String(255))
    occupation = Column(String(100))
    bio = Column(Text)
    photo_url = Column(String(500))

    # Parent relationships
    father_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    mother_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)

    # Self-referential relationships
    father = relationship("FamilyMember", remote_side=[id], foreign_keys=[father_id], backref="children_as_father")
    mother = relationship("FamilyMember", remote_side=[id], foreign_keys=[mother_id], backref="children_as_mother")

    owner = relationship("User", back_populates="family_members")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
