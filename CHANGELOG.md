# Changelog

All notable changes to the Family Tree App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
