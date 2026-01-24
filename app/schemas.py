from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List, Dict, Any


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    is_active: bool
    onboarding_completed: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class FamilyMemberBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    nickname: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    birth_place: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None  # Deprecated - kept for backward compatibility
    profile_picture_data: Optional[str] = None  # Base64-encoded image data
    profile_picture_mime_type: Optional[str] = None  # MIME type (e.g., 'image/jpeg')
    social_media: Optional[Dict[str, Any]] = None
    previous_partners: Optional[str] = None
    father_id: Optional[int] = None
    mother_id: Optional[int] = None


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    nickname: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    birth_place: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    profile_picture_data: Optional[str] = None
    profile_picture_mime_type: Optional[str] = None
    social_media: Optional[Dict[str, Any]] = None
    previous_partners: Optional[str] = None
    father_id: Optional[int] = None
    mother_id: Optional[int] = None


class FamilyMemberResponse(FamilyMemberBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FamilyTreeNode(BaseModel):
    id: int
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    nickname: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    birth_place: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    profile_picture_data: Optional[str] = None
    profile_picture_mime_type: Optional[str] = None
    social_media: Optional[Dict[str, Any]] = None
    previous_partners: Optional[str] = None
    father_id: Optional[int] = None
    mother_id: Optional[int] = None
    children: List[int] = []

    class Config:
        from_attributes = True

# Admin Schemas
class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_admin: bool = False
    permissions: Optional[Dict[str, Any]] = None


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    permissions: Optional[Dict[str, Any]] = None


class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    is_active: bool
    permissions: Optional[Dict[str, Any]] = None
    last_login: Optional[datetime] = None
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemLogResponse(BaseModel):
    id: int
    level: str
    message: str
    user_id: Optional[int] = None
    action: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BackupCreate(BaseModel):
    backup_type: str  # "database" or "full"


class BackupResponse(BaseModel):
    id: int
    filename: str
    backup_type: str
    file_size: Optional[int] = None
    created_by: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_family_trees: int
    total_family_members: int
    total_tree_views: int
    total_tree_shares: int
    recent_logs: List[SystemLogResponse]
    app_version: str
    uptime: str
    database_size: Optional[str] = None
    # System resources
    cpu_percent: float
    cpu_cores: int
    cpu_speed: str
    memory_percent: float
    memory_total: str
    memory_available: str
    disk_percent: float
    disk_total: str
    disk_available: str
    python_version: str
    platform: str
    architecture: str


class AdminSetup(BaseModel):
    app_name: str
    username: str
    email: EmailStr
    password: str


# Family Tree Schemas
class FamilyTreeBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False


class FamilyTreeCreate(FamilyTreeBase):
    pass


class FamilyTreeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class FamilyTreeResponse(FamilyTreeBase):
    id: int
    user_id: int
    is_active: bool
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Tree Share Schemas
class TreeShareCreate(BaseModel):
    tree_id: int
    shared_with_username: str
    permission_level: str = "view"  # "view" or "edit"


class TreeShareResponse(BaseModel):
    id: int
    tree_id: int
    tree_name: str
    shared_by_user_id: int
    shared_by_username: str
    shared_with_user_id: int
    shared_with_username: str
    permission_level: str
    is_accepted: bool
    created_at: datetime

    class Config:
        from_attributes = True
