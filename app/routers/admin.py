from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import List
from datetime import datetime, timedelta
import os
import subprocess
import psutil
from app.database import get_db
from app.models import User, SystemLog, Backup, FamilyMember, TreeView
from app.schemas import (
    AdminUserCreate, AdminUserUpdate, AdminUserResponse,
    SystemLogResponse, BackupCreate, BackupResponse,
    DashboardStats, AdminSetup
)
from app.auth import (
    get_current_admin_user, get_password_hash, check_first_run
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

APP_VERSION = "2.1.0"
START_TIME = datetime.utcnow()


# Helper function to log actions
async def log_action(
    db: AsyncSession,
    level: str,
    message: str,
    user_id: int = None,
    action: str = None,
    details: dict = None,
    ip_address: str = None
):
    log = SystemLog(
        level=level,
        message=message,
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address
    )
    db.add(log)
    await db.commit()


@router.get("/check-first-run")
async def check_first_run_endpoint(db: AsyncSession = Depends(get_db)):
    """Check if this is the first run"""
    is_first_run = await check_first_run(db)
    return {"is_first_run": is_first_run}


@router.post("/setup", response_model=AdminUserResponse)
async def setup_admin(
    admin_data: AdminSetup,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create the first admin user during initial setup"""
    # Check if this is first run
    is_first_run = await check_first_run(db)
    if not is_first_run:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user already exists"
        )

    # Check if username already exists
    result = await db.execute(select(User).where(User.username == admin_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == admin_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create admin user
    hashed_password = get_password_hash(admin_data.password)
    new_admin = User(
        username=admin_data.username,
        email=admin_data.email,
        hashed_password=hashed_password,
        is_admin=True,
        is_active=True,
        onboarding_completed=False
    )

    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    # Log the action
    await log_action(
        db, "INFO", f"Admin user '{admin_data.username}' created during initial setup",
        user_id=new_admin.id, action="admin_setup",
        ip_address=request.client.host
    )

    return new_admin


# Dashboard Stats
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics"""
    # Count users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()

    active_users_result = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    active_users = active_users_result.scalar()

    # Count family members
    total_members_result = await db.execute(select(func.count(FamilyMember.id)))
    total_family_members = total_members_result.scalar()

    # Count tree views
    total_views_result = await db.execute(select(func.count(TreeView.id)))
    total_tree_views = total_views_result.scalar()

    # Get recent logs
    logs_result = await db.execute(
        select(SystemLog).order_by(SystemLog.created_at.desc()).limit(10)
    )
    recent_logs = logs_result.scalars().all()

    # Calculate uptime
    uptime_delta = datetime.utcnow() - START_TIME
    uptime_str = str(uptime_delta).split('.')[0]  # Remove microseconds

    # Get database size
    try:
        db_size_result = await db.execute(text("SELECT pg_database_size(current_database())"))
        db_size_bytes = db_size_result.scalar()
        db_size_mb = db_size_bytes / (1024 * 1024)
        database_size = f"{db_size_mb:.2f} MB"
    except Exception:
        database_size = "N/A"

    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        total_family_members=total_family_members,
        total_tree_views=total_tree_views,
        recent_logs=recent_logs,
        app_version=APP_VERSION,
        uptime=uptime_str,
        database_size=database_size
    )


# User Management
@router.get("/users", response_model=List[AdminUserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all users"""
    result = await db.execute(
        select(User).offset(skip).limit(limit).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return users


@router.post("/users", response_model=AdminUserResponse)
async def create_user(
    user_data: AdminUserCreate,
    request: Request,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user"""
    # Check if username exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        is_admin=user_data.is_admin,
        is_active=True,
        permissions=user_data.permissions
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Log the action
    await log_action(
        db, "INFO", f"User '{user_data.username}' created by admin",
        user_id=current_admin.id, action="user_created",
        details={"created_user_id": new_user.id},
        ip_address=request.client.host
    )

    return new_user


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    user_data: AdminUserUpdate,
    request: Request,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user details"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent admin from deactivating themselves
    if user_id == current_admin.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    # Update fields
    if user_data.email is not None:
        # Check email uniqueness
        email_check = await db.execute(
            select(User).where(User.email == user_data.email, User.id != user_id)
        )
        if email_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_data.email

    if user_data.is_admin is not None:
        user.is_admin = user_data.is_admin

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    if user_data.permissions is not None:
        user.permissions = user_data.permissions

    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    # Log the action
    await log_action(
        db, "INFO", f"User '{user.username}' updated by admin",
        user_id=current_admin.id, action="user_updated",
        details={"updated_user_id": user_id},
        ip_address=request.client.host
    )

    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user"""
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    username = user.username
    await db.delete(user)
    await db.commit()

    # Log the action
    await log_action(
        db, "WARNING", f"User '{username}' deleted by admin",
        user_id=current_admin.id, action="user_deleted",
        details={"deleted_user_id": user_id},
        ip_address=request.client.host
    )

    return {"message": f"User '{username}' deleted successfully"}


# Logs
@router.get("/logs", response_model=List[SystemLogResponse])
async def get_logs(
    skip: int = 0,
    limit: int = 100,
    level: str = None,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get system logs"""
    query = select(SystemLog)

    if level:
        query = query.where(SystemLog.level == level)

    query = query.order_by(SystemLog.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()
    return logs


# Backups
@router.get("/backups", response_model=List[BackupResponse])
async def list_backups(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all backups"""
    result = await db.execute(
        select(Backup).order_by(Backup.created_at.desc())
    )
    backups = result.scalars().all()
    return backups


@router.post("/backups", response_model=BackupResponse)
async def create_backup(
    backup_data: BackupCreate,
    request: Request,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new backup"""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{backup_data.backup_type}_{timestamp}.sql"

    # Create backup directory if it doesn't exist
    backup_dir = "/app/backups"
    os.makedirs(backup_dir, exist_ok=True)
    filepath = os.path.join(backup_dir, filename)

    try:
        if backup_data.backup_type == "database":
            # Database backup using pg_dump
            subprocess.run(
                [
                    "pg_dump",
                    "-h", "db",
                    "-U", "postgres",
                    "-d", "familytree",
                    "-f", filepath
                ],
                check=True,
                env={**os.environ, "PGPASSWORD": "postgres"}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup type"
            )

        # Get file size
        file_size = os.path.getsize(filepath)

        # Create backup record
        backup_record = Backup(
            filename=filename,
            backup_type=backup_data.backup_type,
            file_size=file_size,
            created_by=current_admin.id,
            status="completed"
        )

        db.add(backup_record)
        await db.commit()
        await db.refresh(backup_record)

        # Log the action
        await log_action(
            db, "INFO", f"Backup created: {filename}",
            user_id=current_admin.id, action="backup_created",
            details={"backup_id": backup_record.id, "file_size": file_size},
            ip_address=request.client.host
        )

        return backup_record

    except subprocess.CalledProcessError as e:
        # Log the error
        await log_action(
            db, "ERROR", f"Backup creation failed: {str(e)}",
            user_id=current_admin.id, action="backup_failed",
            ip_address=request.client.host
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup creation failed: {str(e)}"
        )


@router.get("/system-info")
async def get_system_info(
    current_admin: User = Depends(get_current_admin_user)
):
    """Get system information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "cpu_usage": f"{cpu_percent}%",
            "memory_usage": f"{memory.percent}%",
            "memory_total": f"{memory.total / (1024**3):.2f} GB",
            "memory_available": f"{memory.available / (1024**3):.2f} GB",
            "disk_usage": f"{disk.percent}%",
            "disk_total": f"{disk.total / (1024**3):.2f} GB",
            "disk_free": f"{disk.free / (1024**3):.2f} GB"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system info: {str(e)}"
        )
