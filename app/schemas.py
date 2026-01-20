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
    photo_url: Optional[str] = None
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
    total_family_members: int
    total_tree_views: int
    recent_logs: List[SystemLogResponse]
    app_version: str
    uptime: str
    database_size: Optional[str] = None


class AdminSetup(BaseModel):
    username: str
    email: EmailStr
    password: str
