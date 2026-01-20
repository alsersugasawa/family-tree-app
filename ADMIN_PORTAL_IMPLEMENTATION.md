# Admin Portal Implementation Guide

## What Has Been Completed

### 1. Backend Infrastructure ✅

#### Database Models (app/models.py)
- **User Model Enhanced**: Added admin fields
  - `is_admin`: Boolean flag for admin users
  - `is_active`: User account status
  - `permissions`: JSON field for granular permissions
  - `last_login`: Track user login activity
  - `onboarding_completed`: Track if user completed tutorial
  - `updated_at`: Last update timestamp

- **SystemLog Model**: For tracking all system activities
  - Logs level (INFO, WARNING, ERROR)
  - Action tracking with details
  - IP address logging
  - User association

- **Backup Model**: For managing database backups
  - Tracks backup filename, type, size, status
  - Links to admin who created it

#### Schemas (app/schemas.py)
- `AdminUserCreate`, `AdminUserUpdate`, `AdminUserResponse`
- `SystemLogResponse`
- `BackupCreate`, `BackupResponse`
- `DashboardStats`
- `AdminSetup` - for first-run admin creation

#### Authentication (app/auth.py)
- `get_current_active_user()`: Check if user is active
- `get_current_admin_user()`: Admin-only middleware
- `check_first_run()`: Detect if admin needs to be created

#### Admin API Router (app/routers/admin.py)
Complete REST API with endpoints for:

**Setup & Dashboard**
- `GET /api/admin/check-first-run` - Check if first run
- `POST /api/admin/setup` - Create first admin user
- `GET /api/admin/dashboard` - Dashboard statistics

**User Management**
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/{user_id}` - Update user
- `DELETE /api/admin/users/{user_id}` - Delete user

**System Monitoring**
- `GET /api/admin/logs` - View system logs (with filtering)
- `GET /api/admin/system-info` - CPU, memory, disk usage

**Backup Management**
- `GET /api/admin/backups` - List all backups
- `POST /api/admin/backups` - Create new backup

#### Migration (migrations/004_add_admin_features.sql)
- Alters users table with admin fields
- Creates system_logs table
- Creates backups table
- Adds performance indexes

### 2. Dependencies ✅
- Added `psutil==5.9.8` to requirements.txt for system monitoring

### 3. Integration ✅
- Admin router registered in main.py
- App version updated to 1.2.0

## What Needs to Be Completed

### 1. Run Database Migration

```bash
# Apply the migration
cat /Users/alsersugasawa/my-web-app/migrations/004_add_admin_features.sql | docker-compose exec -T db psql -U postgres -d familytree

# Restart the web container
docker-compose restart web

# Install new dependencies
docker-compose exec web pip install psutil
```

### 2. Create Admin Frontend UI

Need to create `/Users/alsersugasawa/my-web-app/static/admin.html` with:

**Pages Required:**
- **Admin Setup Page**: First-run admin creation form
- **Admin Login**: Separate admin login (or use existing with admin check)
- **Admin Dashboard**: Overview with stats cards
  - Total users, active users, family members, tree views
  - Recent logs table
  - System info (CPU, memory, disk)
  - App version and uptime

- **User Management Page**:
  - Users table with actions (edit, delete, toggle active)
  - Create user modal
  - Edit user modal with permissions

- **System Logs Page**:
  - Filterable logs table
  - Export logs functionality

- **Backup Management Page**:
  - List of backups with download links
  - Create backup button
  - Backup status indicators

### 3. Create Admin JavaScript

Need to create `/Users/alsersugasawa/my-web-app/static/admin.js` with:

**Functions Required:**
- `checkFirstRun()` - Check if admin setup needed
- `setupAdmin()` - Create first admin user
- `loadDashboard()` - Fetch and display dashboard stats
- `loadUsers()` - Fetch and display users list
- `createUser()`, `updateUser()`, `deleteUser()` - User CRUD
- `loadLogs()` - Fetch and display system logs
- `loadBackups()`, `createBackup()` - Backup management
- `loadSystemInfo()` - Fetch system metrics

### 4. Add Onboarding/Tutorial System

Create intro.js or similar tutorial for:
- **First Login Tutorial**: Guide new users through the app
- **Admin Tutorial**: Guide admins through admin portal
- **Feature Highlights**: Show new features

**Implementation Options:**
- Use intro.js library (https://introjs.com/)
- Or create custom tooltip system
- Store `onboarding_completed` flag in database

### 5. First-Run Admin Setup Flow

**Modify app startup:**
1. Check if any admin users exist on first page load
2. If no admin exists, redirect to `/static/admin-setup.html`
3. Show admin creation form
4. After setup, redirect to admin dashboard
5. Show onboarding tutorial

### 6. Update Main Index.html

Add first-run check:
```javascript
// On page load
async function checkFirstRun() {
    const response = await fetch('/api/admin/check-first-run');
    const data = await response.json();
    if (data.is_first_run) {
        window.location.href = '/static/admin-setup.html';
    }
}
```

### 7. Create Admin Styles

Need `/Users/alsersugasawa/my-web-app/static/admin-styles.css`:
- Dashboard card styles
- Tables for users/logs/backups
- Modal styles for forms
- Responsive admin layout
- Stat cards with colors
- Action buttons

### 8. Add Backup Directory

Create backups directory in Docker:
```yaml
# In docker-compose.yml, add volume:
volumes:
  - ./backups:/app/backups
```

### 9. Testing Checklist

- [ ] Run migration successfully
- [ ] First-run admin setup works
- [ ] Admin can login and see dashboard
- [ ] User management CRUD operations work
- [ ] System logs are visible and filterable
- [ ] Backups can be created
- [ ] System info displays correctly
- [ ] Onboarding tutorial shows on first login
- [ ] Non-admin users cannot access admin panel
- [ ] Admin cannot delete themselves
- [ ] Admin cannot deactivate themselves

## Quick Start Commands

```bash
# 1. Run migration
cat migrations/004_add_admin_features.sql | docker-compose exec -T db psql -U postgres -d familytree

# 2. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 3. Check logs
docker-compose logs -f web

# 4. Access admin panel (after frontend is built)
# Visit: http://localhost:8080/static/admin-setup.html (first run)
# Or: http://localhost:8080/static/admin.html (subsequent runs)
```

## API Examples

### Create First Admin
```bash
curl -X POST http://localhost:8080/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "secure_password"
  }'
```

### Get Dashboard Stats (with auth token)
```bash
curl -X GET http://localhost:8080/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Backup
```bash
curl -X POST http://localhost:8080/api/admin/backups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backup_type": "database"}'
```

## Security Notes

1. **Admin Access**: Protected by `get_current_admin_user` middleware
2. **Self-Protection**: Admins cannot delete or deactivate themselves
3. **Audit Trail**: All admin actions are logged to system_logs
4. **Password Security**: Uses bcrypt hashing
5. **JWT Tokens**: 24-hour expiration
6. **First-Run**: Only allows admin creation if no admins exist

## Future Enhancements

- Email notifications for admin actions
- Two-factor authentication for admins
- Restore from backup functionality
- Scheduled automatic backups
- User activity dashboard
- Export logs to CSV
- Real-time log streaming with WebSocket
- Advanced permission system (roles and capabilities)
- Admin user groups
- Backup encryption
