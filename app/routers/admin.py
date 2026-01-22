from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import List, Optional
from datetime import datetime, timedelta
import os
import subprocess
import psutil
import shutil
import json
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from app.database import get_db
from app.models import User, SystemLog, Backup, FamilyMember, TreeView, FamilyTree, TreeShare
from app.schemas import (
    AdminUserCreate, AdminUserUpdate, AdminUserResponse,
    SystemLogResponse, BackupCreate, BackupResponse,
    DashboardStats, AdminSetup
)
from app.auth import (
    get_current_admin_user, get_password_hash, check_first_run
)
from app.config import backup_settings

router = APIRouter(prefix="/api/admin", tags=["admin"])

APP_VERSION = "3.0.0"
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

    # Count active users (logged in within last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users_result = await db.execute(
        select(func.count(User.id)).where(
            User.is_active == True,
            User.last_login >= thirty_days_ago
        )
    )
    active_users = active_users_result.scalar()

    # Count family trees
    total_trees_result = await db.execute(select(func.count(FamilyTree.id)))
    total_family_trees = total_trees_result.scalar()

    # Count family members
    total_members_result = await db.execute(select(func.count(FamilyMember.id)))
    total_family_members = total_members_result.scalar()

    # Count tree views
    total_views_result = await db.execute(select(func.count(TreeView.id)))
    total_tree_views = total_views_result.scalar()

    # Count tree shares
    total_shares_result = await db.execute(select(func.count(TreeShare.id)))
    total_tree_shares = total_shares_result.scalar()

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

    # Get system resource usage
    import platform
    import sys

    # CPU metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    cpu_count = psutil.cpu_count()
    try:
        cpu_freq = psutil.cpu_freq()
        cpu_speed = f"{cpu_freq.current:.0f} MHz" if cpu_freq else "N/A"
    except:
        cpu_speed = "N/A"

    # Memory metrics
    memory = psutil.virtual_memory()
    memory_total_gb = memory.total / (1024**3)
    memory_available_gb = memory.available / (1024**3)
    memory_percent = memory.percent

    # Disk metrics
    disk = psutil.disk_usage('/')
    disk_total_gb = disk.total / (1024**3)
    disk_available_gb = disk.free / (1024**3)
    disk_percent = disk.percent

    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        total_family_trees=total_family_trees,
        total_family_members=total_family_members,
        total_tree_views=total_tree_views,
        total_tree_shares=total_tree_shares,
        recent_logs=recent_logs,
        app_version=APP_VERSION,
        uptime=uptime_str,
        database_size=database_size,
        cpu_percent=cpu_percent,
        cpu_cores=cpu_count,
        cpu_speed=cpu_speed,
        memory_percent=memory_percent,
        memory_total=f"{memory_total_gb:.2f} GB",
        memory_available=f"{memory_available_gb:.2f} GB",
        disk_percent=disk_percent,
        disk_total=f"{disk_total_gb:.2f} GB",
        disk_available=f"{disk_available_gb:.2f} GB",
        python_version=sys.version.split()[0],
        platform=platform.system(),
        architecture=platform.machine()
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


def copy_to_file_shares(filepath: str, filename: str) -> List[str]:
    """Copy backup to configured file shares (SMB and NFS)."""
    destinations = []

    # Copy to SMB share if enabled
    if backup_settings.smb_enabled and os.path.ismount(backup_settings.smb_mount_point):
        try:
            smb_dest = os.path.join(backup_settings.smb_mount_point, filename)
            shutil.copy2(filepath, smb_dest)
            destinations.append(f"SMB: {smb_dest}")
        except Exception as e:
            destinations.append(f"SMB: Failed - {str(e)}")

    # Copy to NFS share if enabled
    if backup_settings.nfs_enabled and os.path.ismount(backup_settings.nfs_mount_point):
        try:
            nfs_dest = os.path.join(backup_settings.nfs_mount_point, filename)
            shutil.copy2(filepath, nfs_dest)
            destinations.append(f"NFS: {nfs_dest}")
        except Exception as e:
            destinations.append(f"NFS: Failed - {str(e)}")

    return destinations


def generate_key_from_password(password: str, salt: bytes = None) -> tuple[bytes, bytes]:
    """Generate encryption key from password using PBKDF2."""
    if salt is None:
        salt = os.urandom(16)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt


def encrypt_file(filepath: str, password: str) -> str:
    """Encrypt a file with password and return encrypted filepath."""
    # Read the original file
    with open(filepath, 'rb') as f:
        data = f.read()

    # Generate encryption key from password
    key, salt = generate_key_from_password(password)
    fernet = Fernet(key)

    # Encrypt the data
    encrypted_data = fernet.encrypt(data)

    # Save encrypted file with .encrypted extension
    encrypted_filepath = f"{filepath}.encrypted"
    with open(encrypted_filepath, 'wb') as f:
        # Write salt first (needed for decryption)
        f.write(salt)
        # Then write encrypted data
        f.write(encrypted_data)

    return encrypted_filepath


def decrypt_file(encrypted_filepath: str, password: str) -> str:
    """Decrypt a file with password and return decrypted filepath."""
    # Read the encrypted file
    with open(encrypted_filepath, 'rb') as f:
        # Read salt (first 16 bytes)
        salt = f.read(16)
        # Read encrypted data
        encrypted_data = f.read()

    # Generate key from password using the same salt
    key, _ = generate_key_from_password(password, salt)
    fernet = Fernet(key)

    # Decrypt the data
    try:
        decrypted_data = fernet.decrypt(encrypted_data)
    except Exception as e:
        raise ValueError("Incorrect password or corrupted file")

    # Save decrypted file (remove .encrypted extension)
    if encrypted_filepath.endswith('.encrypted'):
        decrypted_filepath = encrypted_filepath[:-10]  # Remove .encrypted
    else:
        decrypted_filepath = f"{encrypted_filepath}.decrypted"

    with open(decrypted_filepath, 'wb') as f:
        f.write(decrypted_data)

    return decrypted_filepath


def create_config_backup(filepath: str) -> dict:
    """Create a backup of application configuration."""
    config_data = {
        "version": APP_VERSION,
        "backup_timestamp": datetime.utcnow().isoformat(),
        "backup_settings": {
            "backup_dir": backup_settings.backup_dir,
            "backup_retention_days": backup_settings.backup_retention_days,
            "smb_enabled": backup_settings.smb_enabled,
            "smb_host": backup_settings.smb_host if backup_settings.smb_enabled else None,
            "smb_share": backup_settings.smb_share if backup_settings.smb_enabled else None,
            "smb_mount_point": backup_settings.smb_mount_point if backup_settings.smb_enabled else None,
            "nfs_enabled": backup_settings.nfs_enabled,
            "nfs_host": backup_settings.nfs_host if backup_settings.nfs_enabled else None,
            "nfs_export": backup_settings.nfs_export if backup_settings.nfs_enabled else None,
            "nfs_mount_point": backup_settings.nfs_mount_point if backup_settings.nfs_enabled else None,
        },
        "environment": {
            "database_url": os.getenv("DATABASE_URL", "").replace(
                os.getenv("PGPASSWORD", "postgres"), "***REDACTED***"
            ) if os.getenv("DATABASE_URL") else None,
        },
        "docker_files": {}
    }

    # Read docker-compose.yml if it exists
    docker_compose_path = "/app/../docker-compose.yml"
    if os.path.exists(docker_compose_path):
        try:
            with open(docker_compose_path, 'r') as f:
                config_data["docker_files"]["docker-compose.yml"] = f.read()
        except Exception:
            pass

    # Read Dockerfile if it exists
    dockerfile_path = "/app/../Dockerfile"
    if os.path.exists(dockerfile_path):
        try:
            with open(dockerfile_path, 'r') as f:
                config_data["docker_files"]["Dockerfile"] = f.read()
        except Exception:
            pass

    # Read .env.example if it exists (don't read actual .env for security)
    env_example_path = "/app/../.env.example"
    if os.path.exists(env_example_path):
        try:
            with open(env_example_path, 'r') as f:
                config_data["docker_files"][".env.example"] = f.read()
        except Exception:
            pass

    # Write configuration backup as JSON
    with open(filepath, 'w') as f:
        json.dump(config_data, f, indent=2)

    return config_data


@router.post("/backups", response_model=BackupResponse)
async def create_backup(
    backup_data: BackupCreate,
    request: Request,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new backup to local disk and configured file shares"""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    # Determine file extension based on backup type
    if backup_data.backup_type == "config":
        filename = f"backup_config_{timestamp}.json"
    else:
        filename = f"backup_{backup_data.backup_type}_{timestamp}.sql"

    # Use configured backup directory
    backup_dir = backup_settings.backup_dir
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
        elif backup_data.backup_type == "config":
            # Configuration backup
            create_config_backup(filepath)
        elif backup_data.backup_type == "full":
            # Full backup: both database and config
            # Create database backup
            db_filename = f"backup_database_{timestamp}.sql"
            db_filepath = os.path.join(backup_dir, db_filename)
            subprocess.run(
                [
                    "pg_dump",
                    "-h", "db",
                    "-U", "postgres",
                    "-d", "familytree",
                    "-f", db_filepath
                ],
                check=True,
                env={**os.environ, "PGPASSWORD": "postgres"}
            )

            # Create config backup
            config_filename = f"backup_config_{timestamp}.json"
            config_filepath = os.path.join(backup_dir, config_filename)
            create_config_backup(config_filepath)

            # Copy both files to file shares
            db_share_destinations = copy_to_file_shares(db_filepath, db_filename)
            config_share_destinations = copy_to_file_shares(config_filepath, config_filename)

            # Combine file share destinations
            file_share_destinations = []
            if db_share_destinations:
                file_share_destinations.extend([f"DB: {dest}" for dest in db_share_destinations])
            if config_share_destinations:
                file_share_destinations.extend([f"Config: {dest}" for dest in config_share_destinations])

            # Use database file as primary filepath for record
            filepath = db_filepath
            filename = db_filename
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup type. Must be 'database', 'config', or 'full'"
            )

        # Get file size
        file_size = os.path.getsize(filepath)

        # Copy to file shares if configured (for database and config backups only)
        # Full backup already handled above
        if backup_data.backup_type != "full":
            file_share_destinations = copy_to_file_shares(filepath, filename)
        # file_share_destinations already set for full backups

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

        # Log the action with file share info
        log_details = {
            "backup_id": backup_record.id,
            "file_size": file_size,
            "primary_location": filepath
        }
        if file_share_destinations:
            log_details["file_shares"] = file_share_destinations

        await log_action(
            db, "INFO", f"Backup created: {filename}",
            user_id=current_admin.id, action="backup_created",
            details=log_details,
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


@router.get("/backups/{backup_id}/download")
async def download_backup(
    backup_id: int,
    password: Optional[str] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Download a backup file, optionally encrypted with password."""
    # Get backup record
    result = await db.execute(select(Backup).where(Backup.id == backup_id))
    backup = result.scalar_one_or_none()

    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )

    # Construct file path
    filepath = os.path.join(backup_settings.backup_dir, backup.filename)

    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup file not found on disk"
        )

    # If password provided, encrypt the file first
    if password:
        try:
            encrypted_filepath = encrypt_file(filepath, password)
            download_filepath = encrypted_filepath
            download_filename = f"{backup.filename}.encrypted"

            # Log the action
            await log_action(
                db, "INFO", f"Backup {backup.filename} downloaded (encrypted)",
                user_id=current_admin.id, action="backup_download",
                details={"backup_id": backup_id, "encrypted": True}
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Encryption failed: {str(e)}"
            )
    else:
        download_filepath = filepath
        download_filename = backup.filename

        # Log the action
        await log_action(
            db, "INFO", f"Backup {backup.filename} downloaded",
            user_id=current_admin.id, action="backup_download",
            details={"backup_id": backup_id, "encrypted": False}
        )

    # Return file for download
    return FileResponse(
        path=download_filepath,
        filename=download_filename,
        media_type="application/octet-stream"
    )


@router.post("/backups/restore")
async def restore_backup(
    backup_file: UploadFile = File(...),
    password: Optional[str] = None,
    create_snapshot: bool = True,
    request: Request = None,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Restore database from uploaded backup file with automatic snapshot creation."""
    temp_dir = backup_settings.backup_dir
    os.makedirs(temp_dir, exist_ok=True)

    # Save uploaded file
    temp_filepath = os.path.join(temp_dir, f"restore_temp_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.sql")
    snapshot_filename = None
    snapshot_backup_id = None

    try:
        # Step 1: Create snapshot of current database before restoring
        if create_snapshot:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            snapshot_filename = f"snapshot_before_restore_{timestamp}.sql"
            snapshot_filepath = os.path.join(backup_settings.backup_dir, snapshot_filename)

            # Create snapshot backup
            snapshot_result = subprocess.run(
                [
                    "pg_dump",
                    "-h", "db",
                    "-U", "postgres",
                    "-d", "familytree",
                    "-f", snapshot_filepath
                ],
                check=True,
                env={**os.environ, "PGPASSWORD": "postgres"},
                capture_output=True,
                text=True
            )

            if snapshot_result.returncode != 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create snapshot backup: {snapshot_result.stderr}"
                )

            # Get file size and create backup record
            snapshot_file_size = os.path.getsize(snapshot_filepath)
            snapshot_record = Backup(
                filename=snapshot_filename,
                backup_type="snapshot",
                file_size=snapshot_file_size,
                created_by=current_admin.id,
                status="completed"
            )
            db.add(snapshot_record)
            await db.commit()
            await db.refresh(snapshot_record)
            snapshot_backup_id = snapshot_record.id

            # Log snapshot creation
            await log_action(
                db, "INFO", f"Snapshot backup created before restore: {snapshot_filename}",
                user_id=current_admin.id, action="snapshot_created",
                details={
                    "backup_id": snapshot_backup_id,
                    "file_size": snapshot_file_size,
                    "reason": "pre-restore snapshot"
                },
                ip_address=request.client.host if request else None
            )

        # Step 2: Write uploaded file to disk
        with open(temp_filepath, 'wb') as f:
            content = await backup_file.read()
            f.write(content)

        # Step 3: If file is encrypted, decrypt it first
        restore_filepath = temp_filepath
        if password or temp_filepath.endswith('.encrypted'):
            if not password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password required for encrypted backup"
                )

            try:
                restore_filepath = decrypt_file(temp_filepath, password)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e)
                )

        # Step 4: Restore database using psql
        result = subprocess.run(
            [
                "psql",
                "-h", "db",
                "-U", "postgres",
                "-d", "familytree",
                "-f", restore_filepath
            ],
            env={**os.environ, "PGPASSWORD": "postgres"},
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            # Restore failed - inform user about snapshot
            error_msg = f"Database restore failed: {result.stderr}"
            if snapshot_filename:
                error_msg += f"\n\nA snapshot backup was created before the restore attempt: {snapshot_filename} (ID: {snapshot_backup_id}). You can use this to restore to the previous state."
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )

        # Step 5: Log successful restore
        await log_action(
            db, "WARNING", f"Database restored from uploaded backup",
            user_id=current_admin.id, action="backup_restored",
            details={
                "filename": backup_file.filename,
                "encrypted": bool(password),
                "snapshot_created": create_snapshot,
                "snapshot_id": snapshot_backup_id if create_snapshot else None
            },
            ip_address=request.client.host if request else None
        )

        response_data = {
            "message": "Database restored successfully",
            "filename": backup_file.filename
        }

        if snapshot_filename:
            response_data["snapshot"] = {
                "id": snapshot_backup_id,
                "filename": snapshot_filename,
                "message": "A snapshot of the previous database state was created and can be used to roll back if needed"
            }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Restore failed: {str(e)}"
        if snapshot_filename:
            error_msg += f"\n\nA snapshot backup was created: {snapshot_filename} (ID: {snapshot_backup_id})"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    finally:
        # Clean up temporary files
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        if password and restore_filepath != temp_filepath and os.path.exists(restore_filepath):
            os.remove(restore_filepath)


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
