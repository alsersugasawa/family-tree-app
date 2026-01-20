from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Date, JSON, Boolean
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

    family_members = relationship("FamilyMember", back_populates="owner", cascade="all, delete-orphan")
    tree_views = relationship("TreeView", back_populates="owner", cascade="all, delete-orphan")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    nickname = Column(String(100), nullable=True)
    gender = Column(String(20))
    birth_date = Column(Date, nullable=True)
    death_date = Column(Date, nullable=True)
    birth_place = Column(String(255))
    location = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    occupation = Column(String(100))
    bio = Column(Text)
    photo_url = Column(String(500))
    social_media = Column(JSON, nullable=True)  # Store as JSON: {facebook: url, instagram: url, etc}
    previous_partners = Column(Text, nullable=True)  # Comma-separated names or free text

    # Parent relationships
    father_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    mother_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)

    # Self-referential relationships
    father = relationship("FamilyMember", remote_side=[id], foreign_keys=[father_id], backref="children_as_father")
    mother = relationship("FamilyMember", remote_side=[id], foreign_keys=[mother_id], backref="children_as_mother")

    owner = relationship("User", back_populates="family_members")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TreeView(Base):
    __tablename__ = "tree_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_default = Column(Boolean, default=False)

    # Store node positions as JSON: {member_id: {x: float, y: float}}
    node_positions = Column(JSON)

    # Store filter settings as JSON: {show_deceased: bool, gender_filter: [], root_member_id: int}
    filter_settings = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="tree_views")
