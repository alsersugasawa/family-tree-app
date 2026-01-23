# 🚀 v4.0.0 - Major Release

**Previous Version:** 3.0.0
**Release Date:** January 22, 2026

---

## 🎨 Theme System

### New Features
- **Light, Dark, and System Default Modes**
  - Complete theme customization for both web app and admin portal
  - CSS variables for seamless theme transitions
  - Light mode (default) with clean, bright colors
  - Dark mode with comfortable, low-contrast colors
  - System Default mode that follows OS preferences

- **Theme Switcher Component**
  - Dropdown in main app header with three theme options
  - Dropdown in admin portal navigation bar
  - Consistent UI across both portals
  - Bootstrap icon for visual clarity

- **Theme Persistence**
  - localStorage integration for preference saving
  - Persists across sessions and page refreshes
  - Shared preference between main app and admin portal
  - Automatic theme restoration on page load

- **System Preference Detection**
  - `prefers-color-scheme` media query integration
  - Real-time system theme change listeners
  - Automatic theme switching when OS changes theme
  - Works on macOS, Windows, Linux, iOS, Android

---

## ✨ Enhanced UI/UX

- **Context Menu for Tree Nodes**
  - Right-click actions on any tree node
  - Highlight Descendants option
  - View Details and Edit Member actions
  - Export options: JPEG, PDF, CSV
  - Fixed positioning with viewport-relative coordinates

- **Diagram Toolbar**
  - Top-right toolbar with grouped controls
  - Zoom controls: In, Out, Reset
  - Highlight descendants dropdown with clear button
  - Export buttons: JPEG, PDF, CSV
  - Professional Bootstrap icons

- **Consolidated Features**
  - Import CSV feature removed (export still available)
  - Redundant sidebar buttons removed
  - All functionality moved to toolbar and context menu

---

## 🤖 Automated Release System

- **Three-Tier GitHub Actions Workflows**
  - Test Branch Workflow (`test-branch.yml`)
  - Minor Release Workflow (`minor-release.yml`) for bug fixes
  - Major Release Workflow (`major-release.yml`) for new features

- **Automatic Version Updates**
  - Workflows update APP_VERSION in code
  - Git commits with version bump

- **Intelligent Changelog Generation**
  - Categorizes into features, fixes, breaking changes
  - Includes installation instructions

- **In-App Update System**
  - Check for updates from GitHub releases
  - One-click update installation
  - Automatic snapshot backups before updates
  - Zero-downtime updates

---

## 📚 Documentation

- **NEW: USER_GUIDE.md** - Comprehensive user guide with 11 major sections
- **Updated README.md** - v4.0.0 features and quick start
- **Expanded CHANGELOG.md** - Detailed technical documentation
- **Release Process Guides** - Complete workflow documentation

---

## 📋 Installation & Update

### ⚠️ IMPORTANT: Major Release Notes
This is a **major version** release which includes:
- New theme system (no breaking changes to data)
- UI reorganization (context menu + toolbar)
- Removed Import CSV feature
- Updated dependencies

**Recommended Steps:**
1. ✅ Create a full backup before updating
2. ✅ Review changes above
3. ✅ Test in staging environment if available

### Installation Methods

**Method 1: Admin Portal (Recommended)**
1. Log in to Admin Portal at `/admin-login.html`
2. Navigate to Dashboard → Application Updates
3. Click "Check for Updates"
4. Click "Install Update" (automatic backup will be created)

**Method 2: Manual Update**
```bash
# Pull latest code
git fetch origin main
git checkout main
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

**Method 3: Docker Image**
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose down
docker-compose up -d
```

---

## 🔐 Safety & Rollback

### Automatic Safety Features
- ✅ No database migrations required for this version
- ✅ Backward compatible with v3.0.0 data
- ✅ Snapshot backups before updates (via admin portal)

### Rollback Procedure
If you encounter issues after updating:

**Via Admin Portal:**
- Go to Backups section
- Find the snapshot backup (created before update)
- Click "Restore"

**Via Command Line:**
```bash
# Rollback to v3.0.0
git checkout v3.0.0
docker-compose down
docker-compose up -d --build
```

---

## 📊 System Requirements

- Docker 20.10+ and Docker Compose 2.0+
- PostgreSQL 14+
- Python 3.11+
- Minimum 2GB RAM
- 10GB disk space

---

## 🔧 What Changed

### Breaking Changes
- Import CSV feature removed (export still available)
- Some sidebar controls moved to toolbar/context menu
- Theme replaces hard-coded color schemes

### Technical Changes
- Updated version to 4.0.0 across all files
- Added CSS custom properties for theming
- Context menu with fixed positioning
- Theme management with system preference detection

---

## 📖 Documentation

- [User Guide](https://github.com/alsersugasawa/family-tree-app/blob/main/USER_GUIDE.md)
- [CHANGELOG](https://github.com/alsersugasawa/family-tree-app/blob/main/CHANGELOG.md)
- [README](https://github.com/alsersugasawa/family-tree-app/blob/main/README.md)
- [Release Process](https://github.com/alsersugasawa/family-tree-app/blob/main/RELEASE_PROCESS.md)

---

## 🆘 Support

- Report issues: [GitHub Issues](https://github.com/alsersugasawa/family-tree-app/issues)
- Review logs: Admin Portal → Logs
- Check backups: Admin Portal → Backups

---

**Release Type:** 🚀 Major Release
**Upgrade Path:** 3.0.0 → 4.0.0
**Database Migration:** None required
**Estimated Downtime:** ~1-2 minutes (container restart)

Full changelog: https://github.com/alsersugasawa/family-tree-app/blob/main/CHANGELOG.md
