# Family Tree Web Application

A full-stack web application for creating and managing interactive family trees with authentication.

## Features

- User authentication (register/login)
- Add, edit, and delete family members
- Interactive tree visualization using D3.js
- Parent-child relationships tracking
- Detailed member profiles with biography, dates, and more
- Responsive design

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: HTML, CSS, JavaScript, D3.js
- **Authentication**: JWT tokens with bcrypt password hashing

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
- **Web App**: `http://localhost:8000/static/index.html`
- **API Docs**: `http://localhost:8000/docs`

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
- **Web App**: `http://localhost:8000/static/index.html`
- **API Docs**: `http://localhost:8000/docs`

## Usage

### Getting Started

1. Open `http://localhost:8000/static/index.html` in your browser
2. Click "Register here" to create a new account
3. After registration, you'll be automatically logged in
4. Click "Add Family Member" to start building your family tree

### Adding Family Members

1. Click the "Add Family Member" button
2. Fill in the member's details:
   - First and Last Name (required)
   - Gender, Birth Date, Death Date
   - Birth Place, Occupation
   - Biography
   - Select Father and Mother from existing members
3. Click "Save"

### Viewing and Editing

- Click on any node in the tree to view detailed information
- Use the "Edit" button to modify member details
- Use the "Delete" button to remove a member (be careful!)
- Click "Reset View" to refresh the tree visualization

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Family Tree
- `GET /api/family/tree` - Get complete family tree
- `GET /api/family/members` - Get all family members
- `POST /api/family/members` - Create new family member
- `GET /api/family/members/{id}` - Get specific member
- `PUT /api/family/members/{id}` - Update member
- `DELETE /api/family/members/{id}` - Delete member

## Project Structure

```
my-web-app/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   └── routers/
│       ├── auth.py          # Authentication endpoints
│       └── family_tree.py   # Family tree endpoints
├── static/
│   ├── index.html           # Main HTML page
│   ├── styles.css           # CSS styling
│   └── app.js               # Frontend JavaScript
├── Dockerfile               # Docker container configuration
├── docker-compose.yml       # Docker Compose orchestration
├── .dockerignore           # Docker build exclusions
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Security Notes

- Change the `SECRET_KEY` in `app/auth.py` for production use
- Use strong passwords for your database
- Enable HTTPS in production
- Update CORS settings in `app/main.py` for production
- Store sensitive credentials securely (use environment variables, never commit to git)

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

## Future Enhancements

- Photo upload for family members
- Export family tree as PDF/image
- Multiple family trees per user
- Shared family trees with other users
- Advanced search and filtering
- Timeline view of family history

## License

MIT
