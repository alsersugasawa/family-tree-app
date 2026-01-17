from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List


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
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class FamilyMemberBase(BaseModel):
    first_name: str
    last_name: str
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    birth_place: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    father_id: Optional[int] = None
    mother_id: Optional[int] = None


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    birth_place: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
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
    last_name: str
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    birth_place: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    father_id: Optional[int] = None
    mother_id: Optional[int] = None
    children: List[int] = []

    class Config:
        from_attributes = True
