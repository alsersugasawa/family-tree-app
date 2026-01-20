from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List
from datetime import datetime
import shutil
from pathlib import Path
from app.database import get_db
from app.models import User, FamilyTree, FamilyMember, TreeShare
from app.schemas import (
    FamilyTreeCreate, FamilyTreeUpdate, FamilyTreeResponse,
    TreeShareCreate, TreeShareResponse
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/trees", tags=["Family Trees"])


@router.get("/", response_model=List[FamilyTreeResponse])
async def get_user_trees(
    include_shared: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all family trees owned by or shared with the current user"""

    # Get owned trees
    result = await db.execute(
        select(FamilyTree, func.count(FamilyMember.id).label('member_count'))
        .outerjoin(FamilyMember, FamilyTree.id == FamilyMember.tree_id)
        .where(FamilyTree.user_id == current_user.id)
        .group_by(FamilyTree.id)
    )
    owned_trees = result.all()

    trees_response = []
    for tree, member_count in owned_trees:
        tree_dict = {
            'id': tree.id,
            'user_id': tree.user_id,
            'name': tree.name,
            'description': tree.description,
            'is_default': tree.is_default,
            'is_active': tree.is_active,
            'member_count': member_count or 0,
            'created_at': tree.created_at,
            'updated_at': tree.updated_at
        }
        trees_response.append(tree_dict)

    # Get shared trees if requested
    if include_shared:
        result = await db.execute(
            select(FamilyTree, func.count(FamilyMember.id).label('member_count'), TreeShare)
            .join(TreeShare, FamilyTree.id == TreeShare.tree_id)
            .outerjoin(FamilyMember, FamilyTree.id == FamilyMember.tree_id)
            .where(
                and_(
                    TreeShare.shared_with_user_id == current_user.id,
                    TreeShare.is_accepted == True
                )
            )
            .group_by(FamilyTree.id, TreeShare.id)
        )
        shared_trees = result.all()

        for tree, member_count, share in shared_trees:
            tree_dict = {
                'id': tree.id,
                'user_id': tree.user_id,
                'name': f"{tree.name} (Shared)",
                'description': tree.description,
                'is_default': False,
                'is_active': tree.is_active,
                'member_count': member_count or 0,
                'created_at': tree.created_at,
                'updated_at': tree.updated_at
            }
            trees_response.append(tree_dict)

    return trees_response


@router.post("/", response_model=FamilyTreeResponse, status_code=status.HTTP_201_CREATED)
async def create_tree(
    tree_data: FamilyTreeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new family tree"""

    # If this is set as default, unset other defaults
    if tree_data.is_default:
        await db.execute(
            select(FamilyTree)
            .where(FamilyTree.user_id == current_user.id)
        )
        result = await db.execute(
            select(FamilyTree).where(
                and_(
                    FamilyTree.user_id == current_user.id,
                    FamilyTree.is_default == True
                )
            )
        )
        existing_default = result.scalars().first()
        if existing_default:
            existing_default.is_default = False

    now = datetime.utcnow()
    new_tree = FamilyTree(
        user_id=current_user.id,
        created_at=now,
        updated_at=now,
        **tree_data.model_dump()
    )
    db.add(new_tree)
    await db.commit()
    await db.refresh(new_tree)

    # Get member count (will be 0 for new tree)
    return {
        'id': new_tree.id,
        'user_id': new_tree.user_id,
        'name': new_tree.name,
        'description': new_tree.description,
        'is_default': new_tree.is_default,
        'is_active': new_tree.is_active,
        'member_count': 0,
        'created_at': new_tree.created_at,
        'updated_at': new_tree.updated_at
    }


@router.get("/{tree_id}", response_model=FamilyTreeResponse)
async def get_tree(
    tree_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific family tree"""

    # Check if user owns or has access to this tree
    result = await db.execute(
        select(FamilyTree).where(
            and_(
                FamilyTree.id == tree_id,
                or_(
                    FamilyTree.user_id == current_user.id,
                    FamilyTree.id.in_(
                        select(TreeShare.tree_id).where(
                            and_(
                                TreeShare.shared_with_user_id == current_user.id,
                                TreeShare.is_accepted == True
                            )
                        )
                    )
                )
            )
        )
    )
    tree = result.scalar_one_or_none()

    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")

    # Get member count
    result = await db.execute(
        select(func.count(FamilyMember.id)).where(FamilyMember.tree_id == tree_id)
    )
    member_count = result.scalar() or 0

    return {
        'id': tree.id,
        'user_id': tree.user_id,
        'name': tree.name,
        'description': tree.description,
        'is_default': tree.is_default,
        'is_active': tree.is_active,
        'member_count': member_count,
        'created_at': tree.created_at,
        'updated_at': tree.updated_at
    }


@router.put("/{tree_id}", response_model=FamilyTreeResponse)
async def update_tree(
    tree_id: int,
    tree_data: FamilyTreeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a family tree"""

    result = await db.execute(
        select(FamilyTree).where(
            and_(
                FamilyTree.id == tree_id,
                FamilyTree.user_id == current_user.id
            )
        )
    )
    tree = result.scalar_one_or_none()

    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found or you don't have permission")

    # If setting as default, unset other defaults
    if tree_data.is_default:
        result = await db.execute(
            select(FamilyTree).where(
                and_(
                    FamilyTree.user_id == current_user.id,
                    FamilyTree.id != tree_id,
                    FamilyTree.is_default == True
                )
            )
        )
        existing_default = result.scalars().first()
        if existing_default:
            existing_default.is_default = False

    # Update fields
    for field, value in tree_data.model_dump(exclude_unset=True).items():
        setattr(tree, field, value)

    await db.commit()
    await db.refresh(tree)

    # Get member count
    result = await db.execute(
        select(func.count(FamilyMember.id)).where(FamilyMember.tree_id == tree_id)
    )
    member_count = result.scalar() or 0

    return {
        'id': tree.id,
        'user_id': tree.user_id,
        'name': tree.name,
        'description': tree.description,
        'is_default': tree.is_default,
        'is_active': tree.is_active,
        'member_count': member_count,
        'created_at': tree.created_at,
        'updated_at': tree.updated_at
    }


@router.delete("/{tree_id}")
async def delete_tree(
    tree_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a family tree and all its members"""

    result = await db.execute(
        select(FamilyTree).where(
            and_(
                FamilyTree.id == tree_id,
                FamilyTree.user_id == current_user.id
            )
        )
    )
    tree = result.scalar_one_or_none()

    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found or you don't have permission")

    # Delete associated profile pictures
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.tree_id == tree_id)
    )
    members = result.scalars().all()

    for member in members:
        if member.photo_url:
            photo_path = Path(member.photo_url.lstrip('/'))
            if photo_path.exists():
                try:
                    photo_path.unlink()
                except Exception:
                    pass

    await db.delete(tree)
    await db.commit()

    return {"message": "Tree deleted successfully"}


@router.post("/{tree_id}/copy", response_model=FamilyTreeResponse)
async def copy_tree(
    tree_id: int,
    new_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a copy of an existing family tree"""

    # Get the source tree
    result = await db.execute(
        select(FamilyTree).where(
            and_(
                FamilyTree.id == tree_id,
                or_(
                    FamilyTree.user_id == current_user.id,
                    FamilyTree.id.in_(
                        select(TreeShare.tree_id).where(
                            and_(
                                TreeShare.shared_with_user_id == current_user.id,
                                TreeShare.is_accepted == True
                            )
                        )
                    )
                )
            )
        )
    )
    source_tree = result.scalar_one_or_none()

    if not source_tree:
        raise HTTPException(status_code=404, detail="Tree not found")

    # Create new tree
    new_tree = FamilyTree(
        user_id=current_user.id,
        name=new_name,
        description=f"Copy of {source_tree.name}",
        is_default=False,
        is_active=True
    )
    db.add(new_tree)
    await db.flush()

    # Copy all members
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.tree_id == tree_id)
    )
    source_members = result.scalars().all()

    # Map old IDs to new IDs
    id_map = {}

    for old_member in source_members:
        new_member = FamilyMember(
            user_id=current_user.id,
            tree_id=new_tree.id,
            first_name=old_member.first_name,
            middle_name=old_member.middle_name,
            last_name=old_member.last_name,
            nickname=old_member.nickname,
            gender=old_member.gender,
            birth_date=old_member.birth_date,
            death_date=old_member.death_date,
            birth_place=old_member.birth_place,
            location=old_member.location,
            country=old_member.country,
            occupation=old_member.occupation,
            bio=old_member.bio,
            social_media=old_member.social_media,
            previous_partners=old_member.previous_partners,
            # Photo will be copied below
            # Parent relationships will be fixed after all members are created
        )
        db.add(new_member)
        await db.flush()
        id_map[old_member.id] = new_member.id

        # Copy profile picture if exists
        if old_member.photo_url:
            old_path = Path(old_member.photo_url.lstrip('/'))
            if old_path.exists():
                new_filename = f"copy_{old_path.name}"
                new_path = old_path.parent / new_filename
                try:
                    shutil.copy2(old_path, new_path)
                    new_member.photo_url = f"/{new_path}"
                except Exception:
                    pass

    # Fix parent relationships
    for old_member in source_members:
        new_member_id = id_map[old_member.id]
        result = await db.execute(
            select(FamilyMember).where(FamilyMember.id == new_member_id)
        )
        new_member = result.scalar_one()

        if old_member.father_id and old_member.father_id in id_map:
            new_member.father_id = id_map[old_member.father_id]
        if old_member.mother_id and old_member.mother_id in id_map:
            new_member.mother_id = id_map[old_member.mother_id]

    await db.commit()
    await db.refresh(new_tree)

    return {
        'id': new_tree.id,
        'user_id': new_tree.user_id,
        'name': new_tree.name,
        'description': new_tree.description,
        'is_default': new_tree.is_default,
        'is_active': new_tree.is_active,
        'member_count': len(source_members),
        'created_at': new_tree.created_at,
        'updated_at': new_tree.updated_at
    }


# Tree Sharing Endpoints

@router.post("/{tree_id}/share", response_model=TreeShareResponse)
async def share_tree(
    tree_id: int,
    share_data: TreeShareCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Share a family tree with another user"""

    # Verify tree ownership
    result = await db.execute(
        select(FamilyTree).where(
            and_(
                FamilyTree.id == tree_id,
                FamilyTree.user_id == current_user.id
            )
        )
    )
    tree = result.scalar_one_or_none()

    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found or you don't have permission")

    # Find the user to share with
    result = await db.execute(
        select(User).where(User.username == share_data.shared_with_username)
    )
    shared_with_user = result.scalar_one_or_none()

    if not shared_with_user:
        raise HTTPException(status_code=404, detail="User not found")

    if shared_with_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")

    # Check if already shared
    result = await db.execute(
        select(TreeShare).where(
            and_(
                TreeShare.tree_id == tree_id,
                TreeShare.shared_with_user_id == shared_with_user.id
            )
        )
    )
    existing_share = result.scalar_one_or_none()

    if existing_share:
        raise HTTPException(status_code=400, detail="Tree already shared with this user")

    # Create share
    tree_share = TreeShare(
        tree_id=tree_id,
        shared_by_user_id=current_user.id,
        shared_with_user_id=shared_with_user.id,
        permission_level=share_data.permission_level,
        is_accepted=False
    )
    db.add(tree_share)
    await db.commit()
    await db.refresh(tree_share)

    return {
        'id': tree_share.id,
        'tree_id': tree_share.tree_id,
        'tree_name': tree.name,
        'shared_by_user_id': current_user.id,
        'shared_by_username': current_user.username,
        'shared_with_user_id': shared_with_user.id,
        'shared_with_username': shared_with_user.username,
        'permission_level': tree_share.permission_level,
        'is_accepted': tree_share.is_accepted,
        'created_at': tree_share.created_at
    }


@router.get("/shares/pending", response_model=List[TreeShareResponse])
async def get_pending_shares(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending share invitations for the current user"""

    result = await db.execute(
        select(TreeShare, FamilyTree, User)
        .join(FamilyTree, TreeShare.tree_id == FamilyTree.id)
        .join(User, TreeShare.shared_by_user_id == User.id)
        .where(
            and_(
                TreeShare.shared_with_user_id == current_user.id,
                TreeShare.is_accepted == False
            )
        )
    )

    shares = []
    for tree_share, tree, shared_by_user in result.all():
        shares.append({
            'id': tree_share.id,
            'tree_id': tree_share.tree_id,
            'tree_name': tree.name,
            'shared_by_user_id': shared_by_user.id,
            'shared_by_username': shared_by_user.username,
            'shared_with_user_id': current_user.id,
            'shared_with_username': current_user.username,
            'permission_level': tree_share.permission_level,
            'is_accepted': tree_share.is_accepted,
            'created_at': tree_share.created_at
        })

    return shares


@router.post("/shares/{share_id}/accept")
async def accept_share(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept a tree share invitation"""

    result = await db.execute(
        select(TreeShare).where(
            and_(
                TreeShare.id == share_id,
                TreeShare.shared_with_user_id == current_user.id
            )
        )
    )
    tree_share = result.scalar_one_or_none()

    if not tree_share:
        raise HTTPException(status_code=404, detail="Share invitation not found")

    tree_share.is_accepted = True
    await db.commit()

    return {"message": "Share accepted successfully"}


@router.delete("/shares/{share_id}")
async def remove_share(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a tree share (owner can revoke, recipient can decline/leave)"""

    result = await db.execute(
        select(TreeShare).where(TreeShare.id == share_id)
    )
    tree_share = result.scalar_one_or_none()

    if not tree_share:
        raise HTTPException(status_code=404, detail="Share not found")

    # Check if user is owner or recipient
    if tree_share.shared_by_user_id != current_user.id and tree_share.shared_with_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this share")

    await db.delete(tree_share)
    await db.commit()

    return {"message": "Share removed successfully"}
