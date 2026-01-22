# Family Tree Web Application v3.0.0

A full-stack web application for creating and managing interactive family trees with multi-tree support, sharing, and comprehensive admin dashboard.

## Features

### Core Features
- **User authentication** (register/login with JWT tokens)
- **Multiple family trees** - Create unlimited trees per user
- **Tree sharing** - Share trees with other users (view or edit permissions)
- **Profile pictures** - Upload photos with gender-specific colored borders
- **Interactive visualization** - D3.js-powered family tree with zoom/pan
- **Draggable nodes** - Customize layouts with preserved relationships
- **Hover tooltips** - View member info on node hover
- Parent-child relationships tracking
- Detailed member profiles with biography, dates, locations, and social media links

### Data Management
- **CSV export/import** - Backup and migrate family tree data
- **PDF and JPEG export** - Save tree views as high-quality images
- **Multiple saved views** - Create and manage different tree layouts
- **Highlight descendants** - Visual highlighting of family lineages
- Account settings with email/password management

### Admin Portal
- **Dashboard statistics** - Users, trees, members, shares, active users
- **System monitoring** - Real-time CPU, RAM, and disk usage
- **Services overview** - Web app, database, and file storage status
- **User management** - Create, edit, delete users
- **Activity logs** - Track all system actions
- **Database backups** - One-click backup creation

### Responsive Design
- Mobile-friendly interface
- Bootstrap 5.3 UI framework
- Modern, intuitive controls

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL 14
- **Frontend**: HTML, CSS, JavaScript, D3.js v7, Bootstrap 5.3
- **Authentication**: JWT tokens with bcrypt password hashing
- **Monitoring**: psutil for system resource tracking
- **Containerization**: Docker, Docker Compose

## Quick Start (Docker)

The fastest way to get up and running:

```bash
# Start the application (includes PostgreSQL database)
docker-compose up -d

# Wait a few seconds for the database to initialize, then visit:
# http://localhost:8080
```

That's it! All dependencies are included in the container.

## Prerequisites

### Option 1: Docker (Recommended)
- Docker Desktop or Docker Engine
- Docker Compose

### Option 2: Local Development
- Python 3.8+
- PostgreSQL database
- pip (Python package manager)

## Setup Instructions

### Option A: Using Docker (Recommended)

This is the easiest way to run the application with all dependencies included.

#### 1. Install Docker

Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)

#### 2. Run with Docker Compose

```bash
# Start the application and database
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop the application
docker-compose down

# Stop and remove all data
docker-compose down -v
```

The application will be available at:
- **Web App**: `http://localhost:8080/static/index.html`
- **API Docs**: `http://localhost:8080/docs`

#### 3. Managing the Containers

```bash
# Rebuild after code changes
docker-compose up -d --build

# View running containers
docker-compose ps

# Access web container shell
docker-compose exec web bash

# Access database
docker-compose exec db psql -U postgres -d familytree

# View database logs
docker-compose logs db
```

### Option B: Local Development Setup

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**On macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE familytree;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE familytree TO postgres;
\q
```

### 3. Clone and Setup Project

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` and update the database URL if needed:
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/familytree
```

### 5. Run the Application

```bash
uvicorn app.main:app --reload
```

The application will be available at:
- **Web App**: `http://localhost:8080/static/index.html`
- **API Docs**: `http://localhost:8080/docs`

## Usage

### Getting Started

1. Open `http://localhost:8080` in your browser
2. Click "Register here" to create a new account
3. After registration, you'll be automatically logged in
4. Your default tree "My Family Tree" is created automatically
5. Click "Add Family Member" to start building your family tree

### Admin Portal Setup

On first run, you'll need to create an admin account:

1. Visit `http://localhost:8080/static/admin-login.html`
2. If no admin exists, you'll see the setup page
3. Create your admin account with username, email, and password
4. Log in to access the admin dashboard

### Managing Multiple Trees

1. Click the **tree selector dropdown** in the header to view all your trees
2. Click the **gear icon** (⚙) to open Tree Management:
   - **Create New Tree**: Start a new empty tree
   - **Rename Tree**: Update tree name and description
   - **Copy Tree**: Duplicate a tree with all members
   - **Delete Tree**: Remove non-default trees
   - **Save Current As**: Save current tree as a new copy
3. Click the **share icon** to view pending share invitations
4. Use the tree selector to quickly switch between trees

### Adding Family Members

1. Click the "Add Family Member" button
2. Fill in the member's details:
   - **First Name** (required) and **Last Name** (required)
   - Middle Name, Nickname (optional)
   - Gender, Birth Date, Death Date
   - Birth Place, Current Location, Country
   - Occupation, Biography
   - **Profile Picture**: Click "Choose File" to upload (JPEG, PNG, GIF, WebP, max 5MB)
   - **Social Media**: Facebook, Instagram, Twitter, LinkedIn URLs
   - **Previous Partners**: Free-text field for relationship history
   - Select Father and Mother from existing members
3. Click "Save"
4. The member will appear in the current tree

### Viewing and Editing

- **Hover** over any node to see member name, birth/death dates in tooltip
- **Click** on any node to view detailed information panel
- Use the **Edit** button to modify member details
- Use the **Delete** button to remove a member (with confirmation)
- **Drag nodes** around to customize the tree layout
- **Profile pictures** appear on nodes with gender-specific colored borders:
  - Blue for male members
  - Pink for female members
  - Gray for other/unspecified
- Click "Reset View" to refresh the tree visualization

### Sharing Trees

1. Open Tree Management (gear icon)
2. Click **Share** button on any tree card
3. Enter the username of the person to share with
4. Select permission level:
   - **View**: Read-only access
   - **Edit**: Full editing permissions
5. The recipient will see a notification badge
6. They can accept or decline the invitation from the share icon menu

### Exporting Your Family Tree

- **Export CSV**: Download all family member data as a CSV file for backup or migration
- **Import CSV**: Import family members from a CSV file
- **Export PDF**: Save the current tree view as a high-quality PDF document
- **Export JPEG**: Save the current tree view as a JPEG image for sharing

### Managing Multiple Views

1. Click the gear icon (⚙) next to the View selector
2. Create new views with custom names and descriptions
3. Drag nodes to arrange the tree layout
4. Save the view to preserve node positions
5. Switch between different views using the View dropdown
6. Set a view as default to load it automatically

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/update-email` - Update user email
- `PUT /api/auth/update-password` - Update user password
- `DELETE /api/auth/delete-account` - Delete user account

### Family Trees (Multi-Tree)
- `GET /api/trees/` - List all trees for current user
- `POST /api/trees/` - Create new tree
- `GET /api/trees/{id}` - Get tree details
- `PUT /api/trees/{id}` - Update tree name/description
- `DELETE /api/trees/{id}` - Delete tree
- `POST /api/trees/{id}/copy` - Copy tree with new name
- `POST /api/trees/{id}/share` - Share tree with user
- `GET /api/trees/shared` - List trees shared with me
- `GET /api/trees/pending-shares` - List pending invitations
- `POST /api/trees/shares/{id}/accept` - Accept share invitation
- `POST /api/trees/shares/{id}/decline` - Decline share invitation

### Family Members
- `GET /api/family/tree` - Get complete family tree for current tree
- `GET /api/family/members` - Get all family members in current tree
- `POST /api/family/members` - Create new family member
- `GET /api/family/members/{id}` - Get specific member
- `PUT /api/family/members/{id}` - Update member
- `DELETE /api/family/members/{id}` - Delete member
- `POST /api/family-members/{id}/upload-picture` - Upload profile picture

### Tree Views
- `GET /api/tree-views/` - Get all saved views
- `POST /api/tree-views/` - Create new view
- `GET /api/tree-views/{id}` - Get specific view
- `PUT /api/tree-views/{id}` - Update view
- `DELETE /api/tree-views/{id}` - Delete view

### Admin (Admin-only endpoints)
- `GET /api/admin/check-first-run` - Check if admin setup needed
- `POST /api/admin/setup` - Create initial admin user
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/logs` - View system logs
- `GET /api/admin/backups` - List backups
- `POST /api/admin/backups` - Create database backup

## Project Structure

```
my-web-app/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models (User, FamilyMember, FamilyTree, TreeShare, etc.)
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   └── routers/
│       ├── auth.py          # Authentication endpoints
│       ├── family_tree.py   # Family member endpoints
│       ├── family_trees.py  # Multi-tree management endpoints
│       ├── tree_views.py    # Tree views endpoints
│       └── admin.py         # Admin portal endpoints
├── static/
│   ├── index.html           # Main application page
│   ├── styles.css           # Main CSS styling
│   ├── app.js               # Frontend JavaScript (D3.js visualization, multi-tree logic)
│   ├── admin-login.html     # Admin login page
│   ├── admin.html           # Admin dashboard
│   ├── admin-styles.css     # Admin portal CSS
│   └── admin.js             # Admin dashboard JavaScript
├── migrations/
│   ├── 001_add_tree_views.sql        # Tree views feature
│   ├── 002_add_additional_fields.sql # Extra member fields
│   ├── 003_add_node_positions.sql    # Draggable nodes
│   ├── 004_add_admin_features.sql    # Admin portal
│   ├── 005_add_view_thumbnails.sql   # View thumbnails
│   ├── 006_add_family_trees.sql      # Multi-tree support
│   └── 007_fix_multi_tree_data.sql   # Data migration fixes
├── uploads/
│   └── profile_pictures/    # Uploaded profile images
├── backups/                 # Database backups
├── Dockerfile               # Docker container configuration
├── docker-compose.yml       # Docker Compose orchestration
├── .dockerignore           # Docker build exclusions
├── requirements.txt         # Python dependencies
├── CHANGELOG.md            # Version history
└── README.md               # This file
```

## Admin Portal

### Accessing the Admin Portal

**URL**: `http://localhost:8080/static/admin-login.html`

### First-Time Setup

On first run, you'll need to create an admin account:

1. Visit the admin login page
2. If no admin exists, you'll see the setup form
3. Create your admin account with username, email, and password
4. Log in to access the dashboard

### Admin Features

**Dashboard**
- View system statistics (users, trees, members, shares, active users)
- Monitor system resources (CPU, RAM, Disk usage) with color-coded indicators
- View services status (Web app, Database, File storage)
- Check app version, uptime, and system information
- Recent activity logs preview

**User Management**
- View all users with details
- Create new users (with admin or regular permissions)
- Edit users (email, admin status, active/inactive)
- Delete users (with protection - cannot delete yourself)
- Track last login times

**System Logs**
- View all system activity
- Filter by level (INFO, WARNING, ERROR)
- Track actions, user, IP address, and timestamps
- Audit trail for security and compliance

**Backup Management**
- Create database backups with one click
- Download backups directly to your local machine
- Optional AES-256 encryption for downloaded backups with password protection
- Restore database from backup files (encrypted or unencrypted)
- View all backups with sizes, dates, and status
- Backup history tracking
- Configurable backup locations:
  - Local disk storage (default: `/app/backups`)
  - SMB/CIFS file share support
  - NFS file share support
- Automatic backup copying to configured file shares

### Admin Security Features

- Admin-only access with JWT token authentication
- Self-protection (admins cannot delete or deactivate themselves)
- Activity logging for audit trails
- IP address tracking
- Secure password requirements

## Backup Configuration

### Local Disk Backups

By default, backups are stored in `/app/backups` inside the container. Configure this in `.env`:

```bash
BACKUP_DIR=/app/backups
BACKUP_RETENTION_DAYS=30
```

Backups are automatically persisted to the host machine in the `./backups` directory via Docker volume mount. This ensures backups survive container rebuilds.

To use a custom backup location, edit the volume mount in docker-compose.yml:

```yaml
volumes:
  - /your/backup/path:/app/backups
```

The backups directory is excluded from Git via `.gitignore`, so local backups won't be committed.

**Important**: The `./backups` directory will be created automatically when you start the application. Make sure the directory is readable/writable by the Docker container user (UID 1000).

### SMB/CIFS File Share (Optional)

To enable automatic backup copying to an SMB share:

1. **Configure in `.env`:**
   ```bash
   SMB_BACKUP_ENABLED=true
   SMB_HOST=your-smb-server.local
   SMB_SHARE=backups
   SMB_USERNAME=backup_user
   SMB_PASSWORD=your_secure_password
   SMB_MOUNT_POINT=/mnt/smb_backups
   ```

2. **Uncomment in docker-compose.yml:**
   ```yaml
   volumes:
     - smb_backups:/mnt/smb_backups

   # Under volumes section:
   smb_backups:
     driver: local
     driver_opts:
       type: cifs
       o: username=${SMB_USERNAME},password=${SMB_PASSWORD},vers=3.0
       device: //${SMB_HOST}/${SMB_SHARE}
   ```

### NFS File Share (Optional)

To enable automatic backup copying to an NFS share:

1. **Configure in `.env`:**
   ```bash
   NFS_BACKUP_ENABLED=true
   NFS_HOST=your-nfs-server.local
   NFS_EXPORT=/exports/backups
   NFS_MOUNT_POINT=/mnt/nfs_backups
   ```

2. **Uncomment in docker-compose.yml:**
   ```yaml
   volumes:
     - nfs_backups:/mnt/nfs_backups

   # Under volumes section:
   nfs_backups:
     driver: local
     driver_opts:
       type: nfs
       o: addr=${NFS_HOST},rw
       device: ":${NFS_EXPORT}"
   ```

### How Backups Work

#### Creating Backups
1. When you create a backup via the admin portal:
   - Primary backup is saved to `BACKUP_DIR` (default: `/app/backups`)
   - If SMB is enabled and mounted, a copy is sent to the SMB share
   - If NFS is enabled and mounted, a copy is sent to the NFS share
2. Backup status and file share destinations are logged in system logs
3. All backups are tracked in the database with metadata

#### Downloading Backups
From the admin portal, you can download backups with optional encryption:

1. **Standard Download**: Click the "Download" button to download the backup file directly to your local machine
2. **Encrypted Download**:
   - Check "Encrypt backup with password" in the download dialog
   - Enter a strong password
   - The backup will be encrypted using AES-256 encryption (Fernet) before download
   - **Important**: Remember this password - you will need it to restore the backup!
   - Encrypted backups have a `.encrypted` extension

#### Restoring Backups
To restore a database from a backup:

1. Click the "Restore Backup" button in the admin portal
2. Select your backup file (`.sql` or `.sql.encrypted`)
3. **Snapshot Creation** (Recommended):
   - "Create snapshot before restoring" is checked by default
   - This automatically creates a backup of your current database before restoring
   - The snapshot allows you to roll back if the restore doesn't work as expected
   - Snapshots are labeled with 📸 icon and "snapshot" type in the backup list
4. If the backup is encrypted:
   - Check "Backup is encrypted"
   - Enter the decryption password
5. Confirm the restore operation
6. The database will be restored to the state captured in the backup

**Snapshot Rollback**: If you need to undo a restore, simply restore from the snapshot backup that was automatically created. Snapshots are named `snapshot_before_restore_TIMESTAMP.sql` and appear in your backup list.

**⚠️ Warning**: While snapshots provide a safety net, they also consume disk space. The snapshot creation option is enabled by default but can be unchecked if you're certain about the restore.

#### Security Best Practices
- **Always encrypt backups** when downloading for offsite storage
- Use strong, unique passwords for encrypted backups
- Store backup passwords securely (password manager recommended)
- Test your backups regularly by restoring to a development environment
- Keep multiple backup versions with different timestamps
- Store backups in multiple locations (local + SMB/NFS shares)

**Note**: The `/app/backups` directory is created with proper permissions in the Docker container and is owned by the `appuser` non-root user for security.

## Security Notes

### Production Checklist
- **Change SECRET_KEY** in `app/auth.py` to a secure random value
- **Use strong passwords** for database (update docker-compose.yml)
- **Enable HTTPS** in production (use nginx/traefik reverse proxy)
- **Update CORS settings** in `app/main.py` (restrict origins)
- **Set environment variables** securely (never commit .env to git)
- **Configure backup locations** - use dedicated backup storage
- **Enable file shares** - redundant backups to SMB/NFS if available
- **Monitor system logs** - check admin portal regularly
- **Update dependencies** - run `pip list --outdated` periodically

## Troubleshooting

### Docker Issues

**Containers won't start:**
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs

# Restart everything
docker-compose down && docker-compose up -d
```

**Database connection errors:**
```bash
# Wait for database to be ready
docker-compose logs db

# Restart web container
docker-compose restart web
```

**Port already in use:**
```bash
# Change port in docker-compose.yml
# Under web service, change "8000:8000" to "8001:8000"
# Then restart
docker-compose down && docker-compose up -d
```

**Remove all data and start fresh:**
```bash
docker-compose down -v
docker-compose up -d
```

**Admin Portal Issues:**

*"Access denied. Admin privileges required"*
- Ensure you're logged in with an admin account
- Check that `is_admin` flag is true in database:
  ```bash
  docker-compose exec db psql -U postgres -d familytree -c "SELECT username, is_admin FROM users WHERE username='your_username';"
  ```

*"Could not validate credentials"*
- Session may have expired - log in again
- Clear browser localStorage if issues persist

### Local Development Issues

**Database Connection Issues:**
1. Ensure PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
2. Check your database credentials in the `.env` file
3. Verify the database exists: `psql -l`

**Port Already in Use:**
```bash
uvicorn app.main:app --reload --port 8001
```

**Module Import Errors:**
```bash
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## Database Migrations

To apply all migrations after pulling updates:

```bash
# Using Docker Compose
for file in migrations/*.sql; do
  cat "$file" | docker-compose exec -T db psql -U postgres -d familytree
done

# Or manually for each migration
cat migrations/006_add_family_trees.sql | docker-compose exec -T db psql -U postgres -d familytree
cat migrations/007_fix_multi_tree_data.sql | docker-compose exec -T db psql -U postgres -d familytree
```

## What's New in v3.0.0

This major release introduces:

- **Multi-Tree Management**: Create, rename, copy, delete, and share unlimited family trees
- **Tree Sharing**: Share trees with other users with view or edit permissions
- **Profile Pictures**: Upload photos with gender-specific colored borders
- **Hover Tooltips**: See member info on node hover
- **Enhanced Admin Dashboard**:
  - Active users tracking
  - Family trees and shares count
  - Real-time system monitoring (CPU, RAM, Disk)
  - Services status overview with animations
- **Bug Fixes**: Fixed data migration issues, timestamp validation, and SQLAlchemy relationships

See [CHANGELOG.md](CHANGELOG.md) for complete details.

## Future Enhancements

- Advanced search and filtering across all trees
- Timeline view of family history
- PNG export with transparent background
- Batch editing of family members
- Family tree statistics and analytics
- Import from GEDCOM format
- Mobile app (iOS/Android)
- Print-optimized layouts

## License

MIT
