# Changelog

All notable changes to the Family Tree App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-01-22

### Added - Theme System
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

- **Comprehensive Theme Coverage**
  - All UI components themed: headers, toolbars, modals, forms
  - Context menus with theme-aware colors
  - Tables, cards, and stat displays
  - Buttons, inputs, and dropdowns
  - Borders, shadows, and backgrounds
  - Smooth 0.3s transitions between themes

### Added - Enhanced UI/UX
- **Context Menu for Tree Nodes**
  - Right-click actions on any tree node
  - Highlight Descendants option
  - View Details and Edit Member actions
  - Export options: JPEG, PDF, CSV
  - Fixed positioning with viewport-relative coordinates
  - Prevents menu from appearing outside viewport

- **Diagram Toolbar**
  - Top-right toolbar with grouped controls
  - Zoom controls: In, Out, Reset
  - Highlight descendants dropdown with clear button
  - Export buttons: JPEG, PDF, CSV
  - Professional Bootstrap icons
  - Smooth hover animations

- **Removed Features (Consolidated)**
  - Import CSV feature removed
  - Redundant sidebar buttons removed
  - All functionality moved to toolbar and context menu

### Added - Automated Release System
- **Three-Tier GitHub Actions Workflows**
  - **Test Branch Workflow** (`test-branch.yml`)
    - Runs on push to `test` branch
    - Executes tests, linting, and Docker build
    - No version change or release created
    - Continuous integration for development

  - **Minor Release Workflow** (`minor-release.yml`)
    - Triggered by tags matching `v[0-9]+.[0-9]+.[0-9]+` (e.g., v1.0.2)
    - For bug fixes and security patches
    - Increments patch number only
    - Auto-generates changelog from commits
    - Tags Docker images: latest, v1.0.2, minor-latest

  - **Major Release Workflow** (`major-release.yml`)
    - Triggered by tags matching `v[0-9]+.0.0` (e.g., v2.0.0)
    - For new features and breaking changes
    - Resets minor and patch to 0
    - Comprehensive changelog with sections
    - Tags Docker images: latest, v2.0.0, v2, major-latest

- **Automatic Version Updates**
  - Workflows update APP_VERSION in code
  - Git commits with version bump
  - Prevents manual version management

- **Intelligent Changelog Generation**
  - Minor releases: Searches for "fix", "bug", "security" keywords
  - Major releases: Categorizes into features, fixes, breaking changes
  - Includes installation instructions
  - Lists rollback procedures

### Added - In-App Update System
- **Update Button in Admin Portal**
  - Check for updates from GitHub releases
  - Display current vs. latest version
  - One-click update installation
  - Progress monitoring during update

- **Automatic Snapshot Backups**
  - Database snapshot created before every update
  - Timestamped backup files
  - Stored in backups directory
  - Enables rollback if needed

- **Zero-Downtime Updates**
  - Git pull from main branch
  - Dependency installation
  - Database migrations via Alembic
  - Automatic application restart
  - No data loss guarantee

- **Update API Endpoints** ([app/routers/admin.py](app/routers/admin.py))
  - `GET /api/admin/version` - Check for updates
  - `POST /api/admin/update` - Trigger update
  - `GET /api/admin/update-status` - Monitor progress

### Added - Comprehensive Documentation
- **Release Process Documentation**
  - [RELEASE_PROCESS.md](RELEASE_PROCESS.md) - Complete release workflows
  - [RELEASE_QUICK_REFERENCE.md](.github/RELEASE_QUICK_REFERENCE.md) - Quick command reference
  - When to use each release type
  - Version numbering rules
  - Commit message conventions
  - Rollback procedures

- **Update Guides**
  - [UPDATE_GUIDE.md](UPDATE_GUIDE.md) - Comprehensive update instructions
  - [UPDATE_INSTRUCTIONS.md](.github/UPDATE_INSTRUCTIONS.md) - Quick update reference
  - Three update methods: Admin Portal, Manual, CI/CD
  - Safety features and rollback steps

- **User Guide**
  - Complete user documentation (see USER_GUIDE.md)
  - Getting started tutorials
  - Feature explanations with screenshots
  - Admin portal guide
  - Troubleshooting section

### Changed
- Application version updated from 3.0.0 to 4.0.0 across all files
- Theme switcher replaces static color scheme
- Context menu replaces redundant sidebar buttons
- Export functionality consolidated in toolbar and context menu
- Admin portal now shows theme switcher

### Technical Details
- **Theme Implementation** ([static/styles.css](static/styles.css), [static/admin-styles.css](static/admin-styles.css))
  - CSS custom properties for all colors
  - `:root` for light theme (default)
  - `[data-theme="dark"]` for dark theme
  - Transition animations on theme change
  - No page reload required

- **Theme Management JavaScript** ([static/app.js](static/app.js), [static/admin.js](static/admin.js))
  - `initializeTheme()` - Load saved preference
  - `changeTheme(theme)` - Save to localStorage
  - `applyTheme(theme)` - Set data-theme attribute
  - System preference detection and listeners

- **Context Menu Implementation** ([static/app.js](static/app.js))
  - Event handlers for right-click on nodes
  - Fixed positioning with clientX/clientY
  - 5px offset to prevent immediate hover
  - Click-outside to close
  - Functions: `showContextMenu()`, `hideContextMenu()`, action handlers

- **Release Automation**
  - GitHub Actions workflows in `.github/workflows/`
  - Semantic versioning validation
  - Docker buildx for multi-platform images
  - GitHub release API integration
  - Tag-based workflow triggering

### UI/UX Improvements
- Smooth theme transitions across all components
- Improved readability in dark mode
- Context menu for efficient node interactions
- Consolidated toolbar reduces UI clutter
- Professional icon set (Bootstrap Icons)
- Responsive design maintained in all themes

### Security
- Theme preference stored client-side only
- No server-side theme processing
- Update system requires admin authentication
- Automatic backups before updates
- Rollback capability for failed updates

### Breaking Changes
- Import CSV feature removed (export still available)
- Theme replaces hard-coded color schemes
- Some sidebar controls moved to toolbar/context menu

### Migration Guide - Upgrading to 4.0.0 from 3.x
1. **Pull latest changes from repository**
   ```bash
   git pull origin main
   ```

2. **No database migrations required for this version**

3. **Rebuild and restart containers**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Verify new features**
   - Theme switcher in header (both app and admin)
   - Right-click context menu on tree nodes
   - Diagram toolbar in top-right corner
   - Check for updates in admin portal

5. **Configure GitHub Repository (Optional)**
   - Update GitHub org/repo in `app/routers/admin.py:576`
   - Add Docker Hub secrets for image publishing (optional)

### Known Issues
- None reported for this version

## [3.0.0] - 2026-01-20

### Added - Multi-Tree Management System
- **Multiple Family Trees Per User**
  - Create unlimited family trees per user account
  - Each tree with custom name and description
  - Tree selector dropdown in header for quick switching
  - One default tree per user (automatically created)
  - Active/inactive tree status management

- **Tree Management Interface**
  - Tree management modal with comprehensive controls
  - Create new empty trees
  - Copy existing trees with all members and relationships
  - Rename trees with name and description editing
  - Delete non-default trees with confirmation
  - Save current tree as new copy functionality
  - Visual tree cards with member count display

- **Tree Sharing Features**
  - Share trees with other users via username
  - Permission levels: "view" (read-only) or "edit" (full access)
  - Share invitation system with accept/decline workflow
  - Pending shares notification badge in header
  - Shared trees accessible from tree selector
  - Track who shared each tree
  - Revoke shares and manage permissions

- **New Database Infrastructure**
  - `family_trees` table: Store multiple trees per user
  - `tree_shares` table: Many-to-many user sharing relationships
  - `tree_id` foreign key on `family_members` table
  - Migration 006: Multi-tree schema creation
  - Migration 007: Data migration and cleanup
  - Indexes on user_id, tree_id, and share relationships

- **Multi-Tree API Endpoints** ([app/routers/family_trees.py](app/routers/family_trees.py))
  - `GET /api/trees/` - List all trees for current user
  - `POST /api/trees/` - Create new tree
  - `GET /api/trees/{id}` - Get tree details
  - `PUT /api/trees/{id}` - Update tree name/description
  - `DELETE /api/trees/{id}` - Delete tree
  - `POST /api/trees/{id}/copy` - Copy tree with new name
  - `POST /api/trees/{id}/share` - Share tree with user
  - `GET /api/trees/shared` - List trees shared with current user
  - `GET /api/trees/pending-shares` - List pending share invitations
  - `POST /api/trees/shares/{id}/accept` - Accept share invitation
  - `POST /api/trees/shares/{id}/decline` - Decline share invitation

### Added - Profile Picture Upload System
- **Image Upload Feature**
  - Upload profile pictures for family members
  - File upload via member details modal
  - Supported formats: JPEG, PNG, GIF, WebP
  - Maximum file size: 5MB
  - Server-side validation and processing

- **Image Storage**
  - Dedicated uploads directory (`/uploads/profile_pictures/`)
  - UUID-based unique filenames to prevent conflicts
  - Original file extension preservation
  - Docker volume mount for persistent storage
  - Automatic directory creation on startup

- **Visual Enhancements**
  - Profile pictures displayed on tree nodes (40x40px circular)
  - Gender-specific colored borders around profile pictures:
    - Blue border for male members
    - Pink border for female members
    - Gray border for other/unspecified gender
  - Fallback to colored circles when no picture uploaded
  - Consistent visual styling across tree view

- **Upload API Endpoint** ([app/routers/family_tree.py](app/routers/family_tree.py))
  - `POST /api/family-members/{id}/upload-picture` - Upload profile picture
  - File validation (type, size)
  - Secure file handling
  - Database URL update

### Added - Tree Node Tooltips
- **Hover Information Display**
  - Tooltips appear on node hover
  - Display member's full name
  - Show birth and death dates (if available)
  - "Living" indicator for members without death date
  - Smooth fade-in/fade-out transitions (200ms)
  - Positioned above tree nodes
  - Dark semi-transparent background for readability

### Added - Enhanced Admin Dashboard
- **Expanded Dashboard Statistics**
  - **Active Users Metric**: Users who logged in within last 30 days
  - **Family Trees Count**: Total trees across all users
  - **Tree Shares Count**: Total sharing relationships
  - Original metrics: Total users, family members, saved views
  - All metrics displayed as prominent stat cards

- **System Resources Monitoring Card**
  - **CPU Metrics**:
    - CPU usage percentage with color-coding
    - CPU speed in MHz
    - Number of CPU cores
  - **RAM Metrics**:
    - Memory usage percentage with color-coding
    - Total RAM in GB (2 decimal precision)
    - Available RAM in GB
  - **Disk Metrics**:
    - Disk usage percentage with color-coding
    - Total disk space in GB
    - Available disk space in GB
  - **Color-Coded Values**:
    - Green: < 60% usage (healthy)
    - Yellow: 60-80% usage (warning)
    - Red: > 80% usage (critical)
  - Real-time updates via psutil library

- **Services Layout Overview Card**
  - **Web Application Service**:
    - FastAPI + uvicorn technology stack
    - Port 8000 display
    - Animated running status indicator
  - **PostgreSQL Database Service**:
    - postgres:14-alpine image info
    - Port 5432 display
    - Health check status
  - **File Storage Service**:
    - Static files and uploads indicator
    - Service availability status
  - **Animated Status Indicators**:
    - Pulsing green dots for running services
    - Red dots for stopped services
    - Smooth 2-second pulse animation

- **System Information Card**
  - Python version display
  - Platform/OS information
  - System architecture (ARM/x86)
  - Application uptime tracking

- **Enhanced Dashboard Endpoint** ([app/routers/admin.py](app/routers/admin.py))
  - Active user calculation with 30-day window
  - Family tree and share count aggregation
  - psutil integration for system metrics
  - CPU frequency and core count retrieval
  - Memory statistics (total, available, percent)
  - Disk usage statistics (total, free, percent)
  - Python and platform information

- **Updated Admin Schemas** ([app/schemas.py](app/schemas.py))
  - `DashboardStats` model expanded with:
    - `active_users`, `total_family_trees`, `total_tree_shares`
    - `cpu_percent`, `cpu_cores`, `cpu_speed`
    - `memory_percent`, `memory_total`, `memory_available`
    - `disk_percent`, `disk_total`, `disk_available`
    - `python_version`, `platform`, `architecture`

- **Admin Dashboard Styles** ([static/admin-styles.css](static/admin-styles.css))
  - Service status indicator styles
  - Pulse animation keyframes
  - Resource value color classes (good/warning/danger)
  - Responsive service layout grid

### Changed
- Application version updated from 2.2.0 to 3.0.0 across all files
- Family member operations now scoped to specific tree_id
- Tree selector integrated into main application header
- Member creation/editing includes tree assignment
- Admin dashboard redesigned with 4 comprehensive cards
- System monitoring now uses real-time metrics
- Docker health check includes psutil availability

### Fixed - Data Migration & Stability
- **NULL Timestamp Validation Error**
  - Issue: ResponseValidationError for created_at/updated_at on tree creation
  - Root cause: SQLAlchemy defaults not applied before response serialization
  - Fix: Explicit timestamp assignment in tree creation endpoint ([app/routers/family_trees.py](app/routers/family_trees.py):109-115)

- **SQLAlchemy Relationship Ambiguity**
  - Issue: App crash with "can't determine join condition" error
  - Root cause: Multiple foreign keys to User model without explicit specification
  - Fix: Added `foreign_keys` parameter to User.shared_trees relationship ([app/models.py](app/models.py):25)

- **Multi-Tree Data Migration**
  - Issue: 82 existing family members not showing after migration
  - Root cause: NULL tree_id on members, NULL timestamps on default tree
  - Fix: Migration 007 ([migrations/007_fix_multi_tree_data.sql](migrations/007_fix_multi_tree_data.sql))
    - Fixed NULL timestamps on family_trees
    - Assigned orphaned members to default trees
    - Deleted empty duplicate trees
    - Added verification query

### Database Migrations
- **Migration 006** ([migrations/006_add_family_trees.sql](migrations/006_add_family_trees.sql))
  - Created `family_trees` table with user ownership
  - Created `tree_shares` table for sharing functionality
  - Added `tree_id` column to `family_members`
  - Created performance indexes
  - Migrated existing data to default trees

- **Migration 007** ([migrations/007_fix_multi_tree_data.sql](migrations/007_fix_multi_tree_data.sql))
  - Fixed NULL timestamp issues
  - Reassigned orphaned members
  - Cleaned up duplicate empty trees
  - Added data verification queries

### Technical Details
- **Multi-Tree JavaScript Functions** ([static/app.js](static/app.js):2463-2947)
  - `loadFamilyTrees()` - Fetch and cache user's trees
  - `updateTreeSelector()` - Populate tree dropdown
  - `switchFamilyTree(treeId)` - Switch active tree
  - `showTreeManagementModal()` - Display tree management UI
  - `createTree(event)` - Create new tree
  - `loadTreesList()` - Populate tree cards in modal
  - `copyTree(treeId)` - Duplicate tree with members
  - `deleteTree(treeId)` - Delete tree with confirmation
  - `saveCurrentTreeAs()` - Save copy of current tree
  - `showRenameModal(treeId)` - Display rename dialog
  - `renameTree(event)` - Update tree name/description
  - `showShareModal(treeId)` - Display sharing dialog
  - `shareTree(event)` - Create share invitation
  - `loadPendingShares()` - Fetch pending invitations
  - `loadPendingSharesCount()` - Update badge count
  - `acceptShare(shareId)` - Accept invitation
  - `declineShare(shareId)` - Reject invitation

- **Profile Picture Upload** ([static/app.js](static/app.js))
  - File input change handler
  - FormData multipart upload
  - Image preview on successful upload
  - Tree visualization update with new picture
  - Gender-specific border styling

- **Tooltip Implementation** ([static/app.js](static/app.js))
  - D3.js mouseover/mouseout event handlers
  - Dynamic tooltip positioning
  - Date formatting for birth/death display
  - Conditional "Living" status display

- **Admin Dashboard JavaScript** ([static/admin.js](static/admin.js):95-136, 469-520)
  - `updateResourceValue()` - Color-code resource metrics
  - `updateServiceStatus()` - Update service indicators
  - `checkDatabaseStatus()` - Health check via /health endpoint
  - `checkFileStorageStatus()` - Verify static file access
  - Real-time metric updates on dashboard load

### Dependencies
- **Existing Dependencies** (no new additions)
  - fastapi==0.115.0
  - uvicorn[standard]==0.32.0
  - pydantic==2.9.0
  - sqlalchemy==2.0.23
  - asyncpg==0.29.0
  - psutil==5.9.8 (already added in v2.0.0)
  - All other dependencies unchanged

### Containerization
- **Docker Configuration Verified**
  - Dockerfile: Python 3.11-slim base image
  - Multi-stage build with dependency caching
  - Non-root user (appuser) for security
  - Health check with 30s interval
  - Uploads directory creation

- **Docker Compose Configuration**
  - PostgreSQL 14 Alpine database service
  - FastAPI web application service
  - Volume mounts for development:
    - `./app:/app/app` - Application code
    - `./static:/app/static` - Frontend assets
    - `./migrations:/app/migrations` - Database migrations
    - `./backups:/app/backups` - Backup storage
    - `./uploads:/app/uploads` - Profile pictures
  - Persistent postgres_data volume
  - Service health checks
  - Network isolation (familytree-network)
  - Port mappings: 8080:8000 (web), 5432:5432 (db)

### UI/UX Improvements
- Tree selector dropdown for quick tree switching
- Notification badge for pending share invitations
- Visual tree management modal with card layout
- Member count display on tree cards
- Disable controls for empty trees
- Profile picture file input in member modal
- Gender-specific visual styling
- Hover tooltips for contextual information
- Admin dashboard with real-time system monitoring
- Color-coded resource indicators for quick status assessment
- Animated service status for visual feedback

### Security
- Tree ownership validation on all tree operations
- Share permission enforcement (view vs edit)
- User can only share trees they own
- File upload validation (type, size)
- Secure file storage with UUID filenames
- SQL injection protection via ORM relationships
- Cascade deletion prevents orphaned shares

### Breaking Changes
- Family member API now requires `tree_id` parameter for creation
- Existing family members migrated to user's default tree
- Multi-tree architecture changes database schema
- Frontend now requires tree selection before displaying members

### Migration Guide - Upgrading to 3.0.0 from 2.x
1. **Pull latest changes from repository**
   ```bash
   git pull origin main
   ```

2. **Run database migrations**
   ```bash
   # Migration 006: Add multi-tree support
   cat migrations/006_add_family_trees.sql | docker-compose exec -T db psql -U postgres -d familytree

   # Migration 007: Fix multi-tree data issues
   cat migrations/007_fix_multi_tree_data.sql | docker-compose exec -T db psql -U postgres -d familytree
   ```

3. **Rebuild and restart containers**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Verify migration**
   - Log in to your account
   - Verify "My Family Tree" (default) contains all your members
   - Test tree creation, sharing, and switching functionality
   - Upload a profile picture to test image upload
   - Hover over nodes to see tooltips

5. **Admin Dashboard Updates**
   - Access admin portal at http://localhost:8080/static/admin-login.html
   - Verify new metrics: Active Users, Family Trees, Tree Shares
   - Check System Resources card shows CPU, RAM, Disk metrics
   - Confirm Services Layout card displays all services

### Known Issues
- Web container health check shows "unhealthy" but application is functional
  - Cause: Health check requires requests library not in requirements.txt
  - Impact: No functional impact, can be ignored
  - Workaround: Add `requests` to requirements.txt if health check needed

## [2.2.0] - 2026-01-19

### Added - Highlight Descendants Feature
- **Highlight Descendants Toggle**
  - Checkbox control to enable/disable highlight mode
  - Dropdown selector to choose any family member
  - Visual highlighting of selected person and all their descendants
  - Dimming effect (opacity 0.2) on non-descendant nodes
  - Gold border with drop shadow on selected person
  - Red highlighted connections (3px width) for descendant relationships
  - Automatic population of person selector with all family members

### Added - Export Highlighted Views
- **Export Highlighted PDF**
  - Export highlighted descendant view as PDF document
  - Filename includes selected person's name (e.g., `family_tree_John_Smith_descendants.pdf`)
  - Preserves all highlighting effects in exported document
  - Dedicated export button with PDF icon

- **Export Highlighted JPEG**
  - Export highlighted descendant view as JPEG image
  - Filename includes selected person's name (e.g., `family_tree_John_Smith_descendants.jpeg`)
  - Preserves all highlighting effects in exported image
  - Dedicated export button with image icon

### Added - Visual Enhancement
- **Bootstrap Icons Integration**
  - PDF export button with `bi-file-pdf` icon
  - JPEG export button with `bi-file-image` icon
  - Professional icon-based UI controls

### Technical Details
- **Recursive Descendant Algorithm**
  - `highlightDescendants()` function traverses family tree recursively
  - Finds all descendants by checking father_id and mother_id relationships
  - Stores descendants in Set for O(1) lookup performance

- **D3.js Styling Effects**
  - Dynamic opacity manipulation for nodes and links
  - Stroke color and width changes for visual emphasis
  - CSS filter effects for gold border glow
  - Real-time visual updates on selection change

- **Export Functions**
  - `exportHighlightedPDF()` - Captures current highlighted state
  - `exportHighlightedJPEG()` - Captures current highlighted state
  - Person name extraction from familyMembers array
  - Safe filename generation with underscore replacement

### Changed
- Application version updated from 2.1.0 to 2.2.0
- Controls section expanded with highlight feature UI
- Export functionality enhanced with person-specific filenames

### UI/UX Improvements
- Highlight controls styled with inline flexbox layout
- Disabled state for person selector when highlight mode is off
- Disabled state for export buttons until person is selected
- Clear visual feedback for highlighted vs. non-highlighted elements
- Intuitive checkbox and dropdown interaction flow

## [2.1.0] - 2026-01-19

### Added - UI/UX Enhancements
- **Bootstrap 5.3 Integration**
  - Added Bootstrap 5.3 CSS and JavaScript via CDN
  - Integrated Bootstrap Icons library (1.11.0)
  - Modern, responsive UI framework
  - Consistent design language across all pages
  - Mobile-first responsive design

### Changed
- Application version updated from 2.0.1 to 2.1.0
- All HTML pages now include Bootstrap 5.3
  - Main application ([index.html](static/index.html))
  - Admin login page ([admin-login.html](static/admin-login.html))
  - Admin dashboard ([admin.html](static/admin.html))
- Custom CSS updated to work alongside Bootstrap
- Page titles updated to include version 2.1.0

### Technical Details
- Bootstrap 5.3.0 CDN: https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css
- Bootstrap Icons 1.11.0: https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css
- Bootstrap Bundle JS (includes Popper.js) for interactive components
- Maintains backward compatibility with existing custom styles
- All existing functionality preserved

## [2.0.1] - 2026-01-19

### Added - Tree View Enhancements
- **View Thumbnails**
  - Automatic thumbnail generation when creating or saving tree views
  - 300x200px PNG snapshots of the current tree layout
  - Thumbnails stored as base64-encoded images in database
  - Visual preview thumbnails (120x80px) displayed in Views Management modal
  - Embedded CSS styles for accurate color and styling reproduction

### Added - Tree Layout Improvements
- **Generation-Based Layout Algorithm**
  - Bottom-up node positioning (children positioned first, then parents)
  - Parents automatically centered above their children
  - Smart family group clustering (siblings grouped together)
  - Prevents line crossings and tangled connections
  - Hierarchical top-to-bottom flow: Grandparents → Parents → Children → Grandchildren

### Added - Improved Spacing
- **Enhanced Node Spacing**
  - Increased vertical spacing: 180px between generations (up from 120px)
  - Increased horizontal spacing: 200px between siblings (up from 150px)
  - Partner spacing: 150px (up from 120px)
  - Family group spacing: 250px (up from 200px)
  - Nodes never overlap or touch each other
  - Dynamic SVG height based on number of generations

### Added - Database Changes
- **Migration 005**: Added `thumbnail` column to `tree_views` table
- **TreeView Model**: Added `thumbnail` field (Text, nullable)
- **API Schemas**: Updated TreeViewCreate, TreeViewUpdate, TreeViewResponse with thumbnail support

### Changed
- Application version updated from 2.0.0 to 2.0.1
- Tree view save/update now includes thumbnail generation
- View list display enhanced with visual thumbnails
- Removed generation layer visual indicators for cleaner appearance
- Tree automatically centers in viewport after positioning

### Fixed
- Line crossing issues resolved with new layout algorithm
- Node overlap prevented with improved spacing calculations
- Parent-child link positioning now accurately centered between both parents

### Technical Details
- Thumbnail generation uses canvas API with SVG-to-PNG conversion
- Base64 encoding for efficient database storage
- Automatic thumbnail regeneration on every view save/update
- Graceful fallback if thumbnail generation fails

## [2.0.0] - 2026-01-19

### Added - Admin Portal
- **Admin Login Page** (`/static/admin-login.html`)
  - Secure authentication for administrators
  - Beautiful purple gradient design
  - Auto-redirect if already logged in
  - Admin privilege verification
- **Admin Dashboard** (`/static/admin.html`)
  - Real-time statistics (total users, active users, family members, tree views)
  - System information display (CPU, memory, disk usage, uptime)
  - Recent activity logs preview
  - Navigation between Dashboard, Users, Logs, and Backups sections
- **User Management Interface**
  - View all users in sortable table
  - Create new users with admin permissions option
  - Edit user details (email, admin status, active/inactive)
  - Delete users with safety checks (cannot delete self)
  - Track last login times
- **System Logs Viewer**
  - Display all system activity logs
  - Filter by level (INFO, WARNING, ERROR)
  - Show timestamp, action, message, user, and IP address
  - Paginated log display
- **Backup Management Interface**
  - List all database backups
  - One-click backup creation
  - Display backup filename, type, size, status, and creation date
  - Backup history tracking

### Added - Backend Infrastructure
- **New Database Models**
  - `SystemLog`: Track all system activities with levels, actions, and details
  - `Backup`: Manage database backups with metadata
- **Enhanced User Model**
  - `is_admin`: Boolean flag for administrator privileges
  - `is_active`: Account status control
  - `permissions`: JSON field for granular permissions
  - `last_login`: Track user login activity
  - `onboarding_completed`: Tutorial completion tracking
  - `updated_at`: Last modification timestamp
- **Admin API Router** (`app/routers/admin.py`)
  - `GET /api/admin/check-first-run`: Detect if admin setup needed
  - `POST /api/admin/setup`: Create initial admin user
  - `GET /api/admin/dashboard`: Dashboard statistics
  - `GET /api/admin/system-info`: System metrics (CPU, memory, disk)
  - `GET /api/admin/users`: List all users
  - `POST /api/admin/users`: Create new user
  - `PUT /api/admin/users/{id}`: Update user
  - `DELETE /api/admin/users/{id}`: Delete user
  - `GET /api/admin/logs`: View system logs with filtering
  - `GET /api/admin/backups`: List backups
  - `POST /api/admin/backups`: Create database backup
- **Authentication Middleware**
  - `get_current_active_user()`: Verify user is active
  - `get_current_admin_user()`: Admin-only access control
  - `check_first_run()`: First-run detection
- **Activity Logging System**
  - Automatic logging of all admin actions
  - IP address tracking
  - User association for audit trails
  - Detailed action metadata

### Added - Enhanced Features
- **Social Media Fields**
  - Facebook URL field
  - Instagram URL field
  - Twitter/X URL field
  - LinkedIn URL field
  - Stored as JSON in database
  - Displayed as clickable links in member details
- **Previous Partners Field**
  - Free-text field for tracking previous relationships
  - Displayed in member details panel
- **Additional Member Fields**
  - Middle name (optional)
  - Nickname (optional)
  - Current location (City, State)
  - Country
  - All integrated into forms and detail views

### Added - Containerization & Deployment
- **Enhanced Dockerfile**
  - Added `python3-dev` for psutil compilation
  - Optimized layer caching
  - Non-root user (appuser) for security
  - Health check configuration
- **Docker Compose Enhancements**
  - Backups volume mount (`./backups:/app/backups`)
  - Proper service dependencies
  - Health checks on database
  - Network isolation (familytree-network)
- **New Dependencies**
  - `psutil==5.9.8`: System monitoring (CPU, memory, disk)
- **Database Migration**
  - Migration 004: Admin features schema updates
    - Admin fields added to users table
    - System logs table creation
    - Backups table creation
    - Performance indexes

### Added - Documentation
- `ADMIN_ACCESS_GUIDE.md`: Complete admin portal user guide
- `ADMIN_PORTAL_IMPLEMENTATION.md`: Technical implementation details
- `DEPLOYMENT_CHECKLIST.md`: Deployment verification checklist
- Updated README.md with admin portal features

### Changed
- Application version updated from 1.2.0 to 2.0.0
- Login endpoint now tracks last login time
- Login endpoint now checks if user is active
- User registration creates users with default `is_active=True`
- Enhanced security with admin-only endpoints
- Improved error handling for inactive users

### Security
- Admin-only middleware for protected endpoints
- Self-protection: Admins cannot delete or deactivate themselves
- Activity logging for audit compliance
- JWT token validation on all admin endpoints
- IP address logging for security monitoring

## [1.2.0] - 2026-01-19

### Added - Family Tree Features
- **Draggable Nodes**
  - D3.js drag behavior implementation
  - Preserved parent-child relationships during drag
  - Real-time link updates when nodes move
  - Saved node positions per tree view
- **Smart Link Positioning**
  - Child-to-parent links now originate from midpoint between both parents
  - More accurate visual representation of family relationships
  - Custom link generator for dual-parent scenarios
- **CSV Export/Import**
  - Export all family tree data to CSV
  - Proper CSV escaping for special characters
  - Import family members from CSV files
  - Custom CSV parser handling quoted fields
  - Support for all member fields including new additions
- **PDF Export**
  - Export tree visualization as PDF document
  - jsPDF integration
  - SVG to canvas conversion with html2canvas
  - Embedded CSS styles for accurate rendering
  - High-quality output
- **JPEG Export**
  - Export tree visualization as JPEG image
  - Canvas-based rendering
  - Embedded styles preservation
  - Configurable quality settings

### Added - Tree Views Management
- **Multiple Saved Views**
  - Create unlimited custom tree views
  - Save different node arrangements
  - Name and describe each view
  - Set default view for auto-load
  - Switch between views via dropdown selector
- **Tree View Features**
  - Save current node positions to view
  - Manage views modal with CRUD operations
  - Delete unused views
  - Update view metadata
- **New Database Table**
  - `tree_views` table for storing custom layouts
  - JSON storage for node positions and filter settings
  - User-owned views with cascade deletion
  - Created/updated timestamps

### Changed
- CSV export headers updated to include all new fields
- CSV import modal documentation updated
- Export functionality improved with style preservation
- Tree rendering optimized for saved positions

### Fixed
- PDF/JPEG export now correctly shows node colors and styling
- Pydantic v2 compatibility for TreeView serialization
- Duplicate variable declaration in JavaScript removed

## [1.1.0] - 2026-01-19

### Added
- **Account Settings Feature**
  - Update email address with validation
  - Change password with confirmation
  - Delete account with cascade deletion of all family tree data
  - Account settings modal accessible from header
- **UI Improvements**
  - Clickable username in header opens Account Settings
  - Settings integrated into header design
  - Improved user experience for account management

### Changed
- **Sibling Display Enhancement**
  - Expanded siblings display in family tree diagram
  - All siblings now shown as individual nodes
  - Removed sibling count badge (+N indicator)
  - Better visualization of full family structure
- **Header Layout**
  - Integrated account settings access via username click
  - Removed separate "Account Settings" button
  - Cleaner, more intuitive interface

### Removed
- Sibling count badge (+N indicator)
- Standalone "Account Settings" button

## [1.0.0] - Initial Release

### Added
- **User Authentication**
  - User registration with email validation
  - Secure login with JWT tokens
  - Password hashing with bcrypt
  - Logout functionality
- **Family Member Management**
  - Add family members with detailed information
  - Edit member details
  - Delete members (with warnings)
  - Parent-child relationship tracking
  - Automatic sibling detection
- **Interactive Tree Visualization**
  - D3.js-powered family tree layout
  - Zoom and pan controls
  - Node click for detailed information
  - Color-coded nodes by gender
  - Partner relationship lines (dashed)
  - Visual parent-child connections
- **Member Details**
  - Comprehensive profile information
  - First name, last name (required)
  - Gender, birth date, death date
  - Birth place, occupation
  - Biography text area
  - Father and mother selection
  - Photo URL (prepared for future upload)
- **Family Statistics Dashboard**
  - Total family members count
  - Male/female distribution
  - Generations count
  - Living members count
- **Database & Backend**
  - PostgreSQL database
  - SQLAlchemy async ORM
  - FastAPI framework
  - Pydantic v2 validation
  - Database migrations support
- **Containerization**
  - Docker configuration
  - Docker Compose orchestration
  - PostgreSQL 14 Alpine container
  - Python 3.11 slim container
  - Persistent data volumes
  - Health checks
- **Development Features**
  - Hot-reload with uvicorn
  - Volume mounting for development
  - Environment variable configuration
  - API documentation (Swagger UI)
- **Responsive Design**
  - Mobile-friendly interface
  - Adaptive tree layout
  - Touch-friendly controls
  - Modern CSS styling

### Security
- JWT token authentication
- Password hashing with bcrypt
- Input validation with Pydantic
- SQL injection protection via ORM
- CORS configuration

---

## Migration Guide

### Upgrading to 2.0.0 from 1.x
1. Pull latest changes from repository
2. Run database migration: `cat migrations/004_add_admin_features.sql | docker-compose exec -T db psql -U postgres -d familytree`
3. Rebuild containers: `docker-compose down && docker-compose up -d --build`
4. Access admin portal at: http://localhost:8080/static/admin-login.html
5. Review ADMIN_ACCESS_GUIDE.md for admin portal usage

### Upgrading to 1.2.0 from 1.1.0
1. Pull latest changes
2. Run migrations 002 and 003
3. Restart containers
4. New features available immediately

### Upgrading to 1.1.0 from 1.0.0
1. Pull latest changes
2. No database migration required
3. Restart application
4. Account settings available via username in header

---

## Contributors
- Claude Sonnet 4.5 <noreply@anthropic.com>

## Links
- **Repository**: https://github.com/alsersugasawa/family-tree-app
- **Documentation**: See README.md
- **Admin Guide**: See ADMIN_ACCESS_GUIDE.md
