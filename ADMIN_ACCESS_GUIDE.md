# Admin Portal Access Guide

## 🎉 Your Admin Portal is Ready!

The admin portal is now fully functional with a complete web interface.

## Quick Access

### Admin Login Page
**URL**: http://localhost:8080/static/admin-login.html

### Your Admin Credentials
- **Username**: `adminalser`
- **Password**: [Your password from when you created this account]

## What You Can Do

### 1. Dashboard 📊
- View system statistics (users, family members, tree views)
- Monitor system health (CPU, memory, disk usage)
- See recent activity logs
- Check app version and uptime

### 2. User Management 👥
- **View all users** with their details
- **Create new users** with admin or regular permissions
- **Edit users**: Change email, admin status, active/inactive
- **Delete users** (except yourself)
- See last login times

### 3. System Logs 📝
- View all system activity
- Filter by level (INFO, WARNING, ERROR)
- See who did what and when
- Track IP addresses

### 4. Backup Management 💾
- **Create database backups** with one click
- View all backups with sizes and dates
- See backup status
- [Download feature ready for implementation]

## Features

### Security
✅ Admin-only access (checks admin flag)
✅ JWT token authentication
✅ Auto-redirect if not logged in
✅ Token validation on each request
✅ Self-protection (can't delete or deactivate yourself)

### User Experience
✅ Modern, responsive design
✅ Real-time data loading
✅ Intuitive navigation
✅ Modal dialogs for actions
✅ Color-coded status badges
✅ Hover effects and animations

### Data Display
✅ Statistics cards with icons
✅ Sortable data tables
✅ Formatted dates and file sizes
✅ System metrics in real-time
✅ Activity logs with levels

## Files Created

1. **`/static/admin-login.html`** - Admin login page
   - Beautiful gradient design
   - Form validation
   - Auto-redirect if already logged in
   - Error handling

2. **`/static/admin.html`** - Main admin dashboard
   - Navigation bar
   - 4 main sections (Dashboard, Users, Logs, Backups)
   - Modals for user creation/editing
   - Responsive layout

3. **`/static/admin-styles.css`** - Admin portal styles
   - Modern card-based design
   - Purple gradient theme
   - Responsive grid layouts
   - Button styles and badges

4. **`/static/admin.js`** - Admin portal JavaScript
   - API integration
   - Authentication handling
   - CRUD operations for users
   - Data fetching and display

## How to Login

1. Open your browser
2. Go to: **http://localhost:8080/static/admin-login.html**
3. Enter your credentials:
   - Username: `adminalser`
   - Password: [your password]
4. Click "Login to Admin Portal"
5. You'll be redirected to the dashboard

## Navigation

Once logged in, use the top navigation bar:
- **Dashboard**: Overview and statistics
- **Users**: Manage user accounts
- **Logs**: View system logs
- **Backups**: Create and manage backups

Click the **Logout** button in the top right to sign out.

## API Endpoints Used

The frontend connects to these backend APIs:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user info
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/system-info` - System metrics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/logs` - View logs (with filtering)
- `GET /api/admin/backups` - List backups
- `POST /api/admin/backups` - Create backup

## Troubleshooting

### "Access denied. Admin privileges required"
- Make sure you're logging in with an admin account
- Check that `is_admin` is `true` in the database

### "Could not validate credentials"
- Your session may have expired
- Try logging in again
- Clear browser localStorage if issues persist

### Can't access admin portal
- Make sure Docker containers are running: `docker-compose ps`
- Check application is accessible: http://localhost:8080
- Verify admin user exists in database

### Database Check
```bash
# Check if your admin user exists
docker-compose exec -T db psql -U postgres -d familytree -c "SELECT username, email, is_admin FROM users WHERE is_admin = true;"
```

## Next Steps

### Optional Enhancements
- Add user search/filtering
- Export logs to CSV
- Scheduled automatic backups
- Email notifications for critical events
- Two-factor authentication
- User activity dashboard
- Advanced permissions system
- Backup restore functionality

### Integration with Main App
You can add a link to the admin portal in the main app:
```html
<!-- In static/index.html, in the header -->
<a href="/static/admin-login.html" class="admin-link">Admin Portal</a>
```

## Security Notes

🔒 **Production Checklist**:
- Change SECRET_KEY in `app/auth.py`
- Use HTTPS in production
- Set secure password requirements
- Enable rate limiting
- Regular backup schedule
- Monitor system logs
- Update dependencies regularly

## Support

If you need help:
1. Check application logs: `docker-compose logs -f web`
2. Check database: `docker-compose exec db psql -U postgres -d familytree`
3. Review API docs: http://localhost:8080/docs

Enjoy your new admin portal! 🚀
