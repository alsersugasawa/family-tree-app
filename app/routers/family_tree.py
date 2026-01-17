from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.user_id == current_user.id)
    )
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
            photo_url=member.photo_url,
            father_id=member.father_id,
            mother_id=member.mother_id,
            children=member_children.get(member.id, [])
        )
        tree_nodes.append(tree_node)

    return tree_nodes
