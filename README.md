# Family Tree Web Application v4.0.0

A full-stack web application for creating and managing interactive family trees with multi-tree support, sharing, theme customization, and comprehensive admin dashboard.

## Features

### Core Features
- **User authentication** (register/login with JWT tokens)
- **Multiple family trees** - Create unlimited trees per user
- **Tree sharing** - Share trees with other users (view or edit permissions)
- **Theme customization** - Light, Dark, and System Default modes
- **Profile pictures** - Upload photos with gender-specific colored borders
- **Interactive visualization** - D3.js-powered family tree with zoom/pan
- **Draggable nodes** - Customize layouts with preserved relationships
- **Context menu** - Right-click actions for tree nodes
- **Hover tooltips** - View member info on node hover
- Parent-child relationships tracking
- Detailed member profiles with biography, dates, locations, and social media links

### Data Management
- **CSV export** - Backup and export family tree data
- **PDF and JPEG export** - Save tree views as high-quality images from context menu
- **Multiple saved views** - Create and manage different tree layouts
- **Highlight descendants** - Visual highlighting of family lineages via dropdown or context menu
- Account settings with email/password management

### Admin Portal
- **Dashboard statistics** - Users, trees, members, shares, active users
- **System monitoring** - Real-time CPU, RAM, and disk usage
- **Services overview** - Web app, database, and file storage status
- **Application updates** - Check for and install updates from GitHub releases
- **User management** - Create, edit, delete users
- **Activity logs** - Track all system actions
- **Database backups** - One-click backup creation with automatic snapshots before updates

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
## What's New in v4.0.0

This major release introduces:

- **Theme System**: Light, Dark, and System Default modes for both web app and admin portal
  - CSS variables for seamless theme transitions
  - localStorage persistence across sessions
  - Automatic system preference detection
  - Real-time theme change listeners
- **Enhanced UI/UX**:
  - Context menu for tree nodes (right-click actions)
  - Export options (JPEG, PDF, CSV) in context menu
  - Diagram toolbar with zoom controls and export buttons
  - Improved visual consistency across all components
- **Automated Release System**:
  - Three-tier GitHub Actions workflows (test, minor, major releases)
  - Automatic version updates and changelog generation
  - Docker image tagging and publishing
  - In-app update system with automatic backups
- **Documentation**: Comprehensive release guides and update instructions

See [CHANGELOG.md](CHANGELOG.md) for complete details and [USER_GUIDE.md](USER_GUIDE.md) for usage instructions.

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
