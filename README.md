# Family Tree Web Application

[![Version](https://img.shields.io/badge/version-4.0.2-blue.svg)](https://github.com/alsersugasawa/family-tree-app/releases/tag/v4.0.2)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://hub.docker.com/r/alsersugasawa/family-tree-app)

A full-stack web application for creating and managing interactive family trees with multi-tree support, sharing, theme customization, and comprehensive admin dashboard.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Repository Structure](#repository-structure)
- [Documentation](#documentation)
- [Versioning](#versioning)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

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
- **Customizable App Name** - Brand the application with your family name
- **Multi-Version Updates** - Update or rollback to any version via admin portal

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/alsersugasawa/family-tree-app.git
cd family-tree-app

# Start the application
docker-compose up -d

# Access the application
# Web App: http://localhost:8080
# Admin Portal: http://localhost:8080/static/admin-login.html
```

### Manual Installation

```bash
# Install Python 3.11+
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL database
# Create database named 'familytree'

# Run the application
uvicorn app.main:app --reload
```

## 📁 Repository Structure

```
family-tree-app/
├── src/                        # Source code
│   ├── app/                    # FastAPI application
│   │   ├── main.py            # Application entry point
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── database.py        # Database configuration
│   │   ├── auth.py            # Authentication logic
│   │   ├── config.py          # App configuration
│   │   └── routers/           # API route handlers
│   │       ├── admin.py       # Admin endpoints
│   │       ├── auth.py        # Auth endpoints
│   │       ├── family.py      # Family member endpoints
│   │       └── tree.py        # Tree management endpoints
│   ├── static/                # Frontend files
│   │   ├── index.html         # Main application
│   │   ├── admin.html         # Admin portal
│   │   ├── admin-login.html   # Admin login
│   │   ├── setup.html         # Initial setup wizard
│   │   ├── admin.js           # Admin portal JavaScript
│   │   └── styles.css         # Application styles
│   └── migrations/            # Database migrations
│       ├── 001_*.sql          # Initial schema
│       ├── 002_*.sql          # Member fields
│       └── 009_*.sql          # App config
├── test/                      # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── docs/                      # Documentation
│   ├── README.md              # Main documentation
│   ├── CHANGELOG.md           # Version history
│   ├── user/                  # User documentation
│   │   ├── USER_GUIDE.md      # Complete user guide
│   │   └── UPDATE_GUIDE.md    # Update instructions
│   ├── api/                   # API documentation
│   └── deployment/            # Deployment guides
│       └── k8s/               # Kubernetes manifests
├── .github/                   # GitHub configuration
│   └── workflows/             # CI/CD workflows
│       ├── release-template.yml  # Reusable workflow
│       ├── patch-release.yml     # Bug fix releases
│       ├── feature-release.yml   # Feature releases
│       ├── breaking-release.yml  # Major releases
│       └── test-branch.yml       # CI for test branch
├── backups/                   # Database backups (gitignored)
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker image definition
├── requirements.txt           # Python dependencies
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## 📚 Documentation

### User Documentation
- **[User Guide](docs/user/USER_GUIDE.md)** - Complete user documentation with detailed instructions
- **[Update Guide](docs/user/UPDATE_GUIDE.md)** - How to update the application

### Technical Documentation
- **[Changelog](docs/CHANGELOG.md)** - Version history and release notes
- **[Deployment Guide](docs/deployment/k8s/README.md)** - Kubernetes deployment instructions
- **[API Documentation](http://localhost:8080/docs)** - Interactive API docs (when running)

### Development
- **[Workflow Guide](.github/workflows/README.md)** - GitHub Actions workflows
- **[Architecture Diagram](architecture-diagram.md)** - System architecture overview

## 🔢 Versioning

This project follows **[Semantic Versioning 2.0.0](https://semver.org/)**.

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0) - Incompatible API changes, breaking changes
- **MINOR** (4.X.0) - New features, backwards-compatible
- **PATCH** (4.0.X) - Bug fixes, backwards-compatible

### Current Version: 4.0.2

**Recent Changes:**
- ✨ Customizable application name during setup
- ✨ Initial setup wizard for first-time installations
- ✨ Multi-version update system with rollback capability
- 🐛 Fixed family members not appearing in diagrams
- 📝 Enhanced documentation

See [CHANGELOG.md](docs/CHANGELOG.md) for complete version history.

### Version Increment Rules

**Increment PATCH (4.0.1 → 4.0.2):**
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements (no API changes)

**Increment MINOR (4.0.2 → 4.1.0):**
- New features
- New API endpoints
- Deprecated features (still supported)
- Substantial internal improvements

**Increment MAJOR (4.1.0 → 5.0.0):**
- Breaking API changes
- Removed deprecated features
- Database schema breaking changes
- Changed authentication methods
- Incompatible configuration changes

## 💻 Development

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- Node.js (for frontend tooling, optional)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/alsersugasawa/family-tree-app.git
cd family-tree-app

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install pytest pytest-cov flake8 black

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
# Migrations run automatically on startup

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src/app --cov-report=html

# Run specific test file
pytest test/unit/test_auth.py

# Run linting
flake8 src/app
```

### Development Workflow

1. **Create a feature branch from `test`:**
   ```bash
   git checkout test
   git pull origin test
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes in `src/`**
   - Application code: `src/app/`
   - Frontend: `src/static/`
   - Migrations: `src/migrations/`

3. **Write tests in `test/`**
   ```bash
   pytest test/unit/test_your_feature.py
   ```

4. **Commit with conventional commits:**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update documentation"
   ```

5. **Push to `test` branch:**
   ```bash
   git checkout test
   git merge feature/your-feature-name
   git push origin test
   # GitHub Actions will run CI tests
   ```

6. **Merge to `main` and tag for release:**
   ```bash
   git checkout main
   git merge test
   git tag -a v4.0.3 -m "fix: bug fixes"
   git push origin main --tags
   # GitHub Actions will create release and build Docker image
   ```

## 🚀 Deployment

### Docker Compose (Development & Small Deployments)

```bash
docker-compose up -d
```

### Kubernetes (Production)

```bash
# Apply all manifests
kubectl apply -f docs/deployment/k8s/

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=family-tree-web -n family-tree --timeout=120s

# Access the application
kubectl port-forward -n family-tree svc/family-tree-web 8080:80
```

See [Kubernetes Deployment Guide](docs/deployment/k8s/README.md) for detailed instructions.

### Docker Hub

Pre-built images available at:
```bash
docker pull alsersugasawa/family-tree-app:latest
docker pull alsersugasawa/family-tree-app:v4.0.2
docker pull alsersugasawa/family-tree-app:4.0
docker pull alsersugasawa/family-tree-app:4
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow coding standards:**
   - Use type hints in Python
   - Follow PEP 8 style guide
   - Write docstrings for functions
   - Add tests for new features
4. **Commit using conventional commits:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Coding Standards

- Python code must pass `flake8` linting
- Test coverage should be maintained above 80%
- All tests must pass before merging
- Documentation must be updated for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** [docs/](docs/)
- **GitHub Issues:** [Report a bug](https://github.com/alsersugasawa/family-tree-app/issues)
- **Discussions:** [Ask questions](https://github.com/alsersugasawa/family-tree-app/discussions)

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [Bootstrap](https://getbootstrap.com/)
- Visualizations by [D3.js](https://d3js.org/)
- Containerized with [Docker](https://www.docker.com/)

---

**Version:** 4.0.2
**Last Updated:** 2026-01-24
**Maintainer:** alsersugasawa
