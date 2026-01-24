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
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    permissions = Column(JSON, nullable=True)  # Store user permissions as JSON
    last_login = Column(DateTime, nullable=True)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    family_members = relationship("FamilyMember", back_populates="owner", cascade="all, delete-orphan")
    tree_views = relationship("TreeView", back_populates="owner", cascade="all, delete-orphan")
    family_trees = relationship("FamilyTree", back_populates="owner", cascade="all, delete-orphan")
    shared_trees = relationship("TreeShare", foreign_keys="TreeShare.shared_with_user_id", back_populates="shared_with_user", cascade="all, delete-orphan")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tree_id = Column(Integer, ForeignKey("family_trees.id"), nullable=True)  # Link to family tree
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
    photo_url = Column(String(500))  # Deprecated: kept for backward compatibility
    profile_picture_data = Column(Text, nullable=True)  # Base64-encoded image data
    profile_picture_mime_type = Column(String(50), nullable=True)  # e.g., 'image/jpeg', 'image/png'
    social_media = Column(JSON, nullable=True)  # Store as JSON: {facebook: url, instagram: url, etc}
    previous_partners = Column(Text, nullable=True)  # Comma-separated names or free text

    # Parent relationships
    father_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    mother_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)

    # Self-referential relationships
    father = relationship("FamilyMember", remote_side=[id], foreign_keys=[father_id], backref="children_as_father")
    mother = relationship("FamilyMember", remote_side=[id], foreign_keys=[mother_id], backref="children_as_mother")

    owner = relationship("User", back_populates="family_members")
    tree = relationship("FamilyTree", back_populates="members")
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

    # Store thumbnail as base64 encoded PNG image
    thumbnail = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="tree_views")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), nullable=False)  # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100))  # e.g., "user_created", "backup_created"
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


class Backup(Base):
    __tablename__ = "backups"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    backup_type = Column(String(50), nullable=False)  # "database" or "full"
    file_size = Column(Integer)  # Size in bytes
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="completed")  # "completed", "failed", "in_progress"
    created_at = Column(DateTime, default=datetime.utcnow)


class FamilyTree(Base):
    __tablename__ = "family_trees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="family_trees")
    members = relationship("FamilyMember", back_populates="tree", cascade="all, delete-orphan")
    shares = relationship("TreeShare", back_populates="tree", cascade="all, delete-orphan")


class TreeShare(Base):
    __tablename__ = "tree_shares"

    id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("family_trees.id"), nullable=False)
    shared_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shared_with_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    permission_level = Column(String(20), default="view")  # "view", "edit"
    is_accepted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tree = relationship("FamilyTree", back_populates="shares")
    shared_by_user = relationship("User", foreign_keys=[shared_by_user_id])
    shared_with_user = relationship("User", foreign_keys=[shared_with_user_id], back_populates="shared_trees")


class AppConfig(Base):
    __tablename__ = "app_config"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
