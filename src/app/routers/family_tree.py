from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import os
import uuid
import base64
from pathlib import Path
from app.database import get_db
from app.models import User, FamilyMember
from app.schemas import FamilyMemberCreate, FamilyMemberUpdate, FamilyMemberResponse, FamilyTreeNode
from app.auth import get_current_user

router = APIRouter(prefix="/api/family", tags=["Family Tree"])


@router.post("/members", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_family_member(
    member_data: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate parent IDs if provided
    if member_data.father_id:
        result = await db.execute(
            select(FamilyMember).where(
                FamilyMember.id == member_data.father_id,
                FamilyMember.user_id == current_user.id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Father not found")

    if member_data.mother_id:
        result = await db.execute(
            select(FamilyMember).where(
                FamilyMember.id == member_data.mother_id,
                FamilyMember.user_id == current_user.id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Mother not found")

    new_member = FamilyMember(
        user_id=current_user.id,
        **member_data.model_dump()
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    return new_member


@router.get("/members", response_model=List[FamilyMemberResponse])
async def get_all_family_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.user_id == current_user.id)
    )
    members = result.scalars().all()
    return members


@router.get("/members/{member_id}", response_model=FamilyMemberResponse)
async def get_family_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.user_id == current_user.id
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
    return member


@router.put("/members/{member_id}", response_model=FamilyMemberResponse)
async def update_family_member(
    member_id: int,
    member_data: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.user_id == current_user.id
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    # Update only provided fields
    update_data = member_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)

    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.user_id == current_user.id
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    await db.delete(member)
    await db.commit()


@router.get("/tree", response_model=List[FamilyTreeNode])
async def get_family_tree(
    tree_id: int = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Build query based on tree_id
    query = select(FamilyMember).where(FamilyMember.user_id == current_user.id)

    if tree_id:
        query = query.where(FamilyMember.tree_id == tree_id)

    result = await db.execute(query)
    members = result.scalars().all()

    # Build tree structure with children relationships
    tree_nodes = []
    member_children = {}

    for member in members:
        member_children[member.id] = []

    for member in members:
        if member.father_id and member.father_id in member_children:
            member_children[member.father_id].append(member.id)
        if member.mother_id and member.mother_id in member_children:
            if member.id not in member_children[member.mother_id]:
                member_children[member.mother_id].append(member.id)

    for member in members:
        # Convert base64 profile picture to data URL for frontend
        photo_url = member.photo_url  # Fallback to old field
        if member.profile_picture_data and member.profile_picture_mime_type:
            photo_url = f"data:{member.profile_picture_mime_type};base64,{member.profile_picture_data}"

        tree_node = FamilyTreeNode(
            id=member.id,
            first_name=member.first_name,
            last_name=member.last_name,
            gender=member.gender,
            birth_date=member.birth_date,
            death_date=member.death_date,
            birth_place=member.birth_place,
            occupation=member.occupation,
            bio=member.bio,
            photo_url=photo_url,
            profile_picture_data=member.profile_picture_data,
            profile_picture_mime_type=member.profile_picture_mime_type,
            father_id=member.father_id,
            mother_id=member.mother_id,
            children=member_children.get(member.id, [])
        )
        tree_nodes.append(tree_node)

    return tree_nodes


@router.post("/members/{member_id}/upload-photo")
async def upload_member_photo(
    member_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a profile picture for a family member"""

    # Verify member belongs to current user
    result = await db.execute(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.user_id == current_user.id
        )
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        )

    # Validate file size (max 5MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    # Convert image to base64 for database storage
    base64_data = base64.b64encode(content).decode('utf-8')

    # Store in database instead of file system
    member.profile_picture_data = base64_data
    member.profile_picture_mime_type = file.content_type

    # Clear deprecated photo_url field
    member.photo_url = None

    await db.commit()
    await db.refresh(member)

    # Return data URL format for immediate use by frontend
    data_url = f"data:{file.content_type};base64,{base64_data}"

    return {
        "message": "Photo uploaded successfully",
        "profile_picture_data": data_url,
        "mime_type": file.content_type
    }
