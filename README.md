# Family Tree Web Application v4.0.0

A full-stack web application for creating and managing interactive family trees with multi-tree support, sharing, theme customization, and comprehensive admin dashboard.

## Core Features

- **User Authentication** - Secure register/login with JWT tokens
- **Multiple Family Trees** - Create unlimited trees per user
- **Tree Sharing** - Collaborate with view or edit permissions
- **Interactive Visualization** - D3.js-powered tree with zoom/pan/drag
- **Theme Customization** - Light, Dark, and System Default modes
- **Profile Pictures** - Upload photos with gender-specific borders
- **Context Menu** - Right-click actions on tree nodes
- **Export Options** - JPEG, PDF, and CSV export
- **Admin Portal** - User management, backups, system monitoring, updates
- **Responsive Design** - Mobile-friendly Bootstrap 5.3 interface

## What's New in v4.0.0

- **Theme System** - Light, Dark, and System Default modes with CSS variables
- **Enhanced UI/UX** - Context menu, diagram toolbar, improved visual consistency
- **Automated Release System** - GitHub Actions workflows for CI/CD
- **Database Storage for Images** - Profile pictures stored securely in database instead of file system
- **Comprehensive Documentation** - Complete USER_GUIDE.md with troubleshooting

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL 14
- **Frontend**: HTML, CSS, JavaScript, D3.js v7, Bootstrap 5.3
- **Authentication**: JWT tokens with bcrypt password hashing
- **Monitoring**: psutil for system resource tracking
- **Containerization**: Docker, Docker Compose

## Quick Start with Docker

```bash
# Start the application (includes PostgreSQL database)
docker-compose up -d

# Visit the application
# http://localhost:8080
```

All dependencies are included in the container.

## Prerequisites

**Option 1: Docker (Recommended)**
- Docker Desktop or Docker Engine
- Docker Compose

**Option 2: Kubernetes**
- Kubernetes cluster (v1.20+)
- kubectl configured
- Container registry access

**Option 3: Local Development**
- Python 3.8+
- PostgreSQL 14
- pip (Python package manager)

## Setup Instructions

### Option A: Docker Setup (Recommended)

1. **Install Docker Desktop**
   Download from [docker.com](https://www.docker.com/products/docker-desktop/)

2. **Start the Application**
   ```bash
   docker-compose up -d
   ```

3. **Access the Application**
   - Web App: `http://localhost:8080`
   - API Docs: `http://localhost:8080/docs`

4. **Common Commands**
   ```bash
   # Rebuild after changes
   docker-compose up -d --build

   # View logs
   docker-compose logs -f web

   # Stop application
   docker-compose down
   ```

### Option B: Kubernetes Setup

1. **Prerequisites**
   - Kubernetes cluster running
   - kubectl configured
   - Ingress controller installed (optional)

2. **Quick Deploy**
   ```bash
   # Deploy all resources
   kubectl apply -f k8s/

   # Wait for pods to be ready
   kubectl wait --for=condition=ready pod -l app=family-tree-web -n family-tree --timeout=120s
   ```

3. **Access the Application**
   ```bash
   # Port forward
   kubectl port-forward -n family-tree svc/family-tree-web 8080:80

   # Access at http://localhost:8080
   ```

4. **See [k8s/README.md](k8s/README.md) for:**
   - Detailed deployment instructions
   - Scaling and autoscaling
   - Monitoring and logging
   - Production best practices

### Option C: Local Development Setup

1. **Install PostgreSQL 14**
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create Database**
   ```bash
   psql postgres
   CREATE DATABASE familytree;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE familytree TO postgres;
   \q
   ```

3. **Setup Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

5. **Run Application**
   ```bash
   uvicorn app.main:app --reload
   ```

## Getting Started

1. Visit `http://localhost:8080`
2. Register a new account
3. Start building your family tree

For detailed usage instructions, admin portal setup, and troubleshooting, see [USER_GUIDE.md](USER_GUIDE.md).

## Future Enhancements

- Advanced search and filtering across all trees
- Timeline view of family history
- PNG export with transparent background
- Batch editing of family members
- Family tree statistics and analytics
- Import from GEDCOM format
- Mobile app (iOS/Android)
- Print-optimized layouts

## Documentation

- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete user documentation with detailed instructions
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes

## License

MIT
