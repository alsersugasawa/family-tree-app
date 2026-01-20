from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models import TreeView, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/tree-views", tags=["tree_views"])


# Pydantic schemas
class TreeViewCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False
    node_positions: Optional[dict] = None
    filter_settings: Optional[dict] = None
    thumbnail: Optional[str] = None


class TreeViewUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    node_positions: Optional[dict] = None
    filter_settings: Optional[dict] = None
    thumbnail: Optional[str] = None


class TreeViewResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_default: bool
    node_positions: Optional[dict]
    filter_settings: Optional[dict]
    thumbnail: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


@router.get("/", response_model=List[TreeViewResponse])
async def get_user_tree_views(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tree views for the current user."""
    result = await db.execute(
        select(TreeView)
        .where(TreeView.user_id == current_user.id)
        .order_by(TreeView.is_default.desc(), TreeView.created_at.desc())
    )
    views = result.scalars().all()
    return views


@router.get("/{view_id}", response_model=TreeViewResponse)
async def get_tree_view(
    view_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific tree view."""
    result = await db.execute(
        select(TreeView).where(
            TreeView.id == view_id,
            TreeView.user_id == current_user.id
        )
    )
    view = result.scalar_one_or_none()

    if not view:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree view not found"
        )

    return view


@router.post("/", response_model=TreeViewResponse, status_code=status.HTTP_201_CREATED)
async def create_tree_view(
    view_data: TreeViewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new tree view."""
    # If this view is set as default, unset all other defaults
    if view_data.is_default:
        await db.execute(
            update(TreeView)
            .where(TreeView.user_id == current_user.id)
            .values(is_default=False)
        )

    new_view = TreeView(
        user_id=current_user.id,
        name=view_data.name,
        description=view_data.description,
        is_default=view_data.is_default,
        node_positions=view_data.node_positions or {},
        filter_settings=view_data.filter_settings or {},
        thumbnail=view_data.thumbnail
    )

    db.add(new_view)
    await db.commit()
    await db.refresh(new_view)

    return new_view


@router.put("/{view_id}", response_model=TreeViewResponse)
async def update_tree_view(
    view_id: int,
    view_data: TreeViewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing tree view."""
    result = await db.execute(
        select(TreeView).where(
            TreeView.id == view_id,
            TreeView.user_id == current_user.id
        )
    )
    view = result.scalar_one_or_none()

    if not view:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree view not found"
        )

    # If setting as default, unset all other defaults
    if view_data.is_default:
        await db.execute(
            update(TreeView)
            .where(TreeView.user_id == current_user.id, TreeView.id != view_id)
            .values(is_default=False)
        )

    # Update fields
    if view_data.name is not None:
        view.name = view_data.name
    if view_data.description is not None:
        view.description = view_data.description
    if view_data.is_default is not None:
        view.is_default = view_data.is_default
    if view_data.node_positions is not None:
        view.node_positions = view_data.node_positions
    if view_data.filter_settings is not None:
        view.filter_settings = view_data.filter_settings
    if view_data.thumbnail is not None:
        view.thumbnail = view_data.thumbnail

    await db.commit()
    await db.refresh(view)

    return view


@router.delete("/{view_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tree_view(
    view_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a tree view."""
    result = await db.execute(
        select(TreeView).where(
            TreeView.id == view_id,
            TreeView.user_id == current_user.id
        )
    )
    view = result.scalar_one_or_none()

    if not view:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree view not found"
        )

    await db.delete(view)
    await db.commit()
