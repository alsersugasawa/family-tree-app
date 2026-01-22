# Quick Update Instructions

## For End Users (Admin Portal)

1. Go to Admin Dashboard: `http://your-server:8080/admin-login.html`
2. Click "Check for Updates" button
3. If update available, click "Install Update"
4. Wait ~1-2 minutes for automatic restart
5. Done! Your data is safe with automatic backup.

## For Developers (Git)

```bash
# Create a release
git tag -a v3.1.0 -m "Release 3.1.0"
git push origin main --tags

# Update version in code
# Edit app/routers/admin.py: APP_VERSION = "3.1.0"
```

## For DevOps (Docker)

```bash
# Pull and restart
docker-compose pull
docker-compose up -d
```

## Important Notes

- ⚠️ **Automatic Backup**: Snapshot created before EVERY update
- 📦 **Zero Data Loss**: All data preserved during updates
- 🔄 **Auto Migrations**: Database schema updates automatically
- ⏱️ **Downtime**: ~30 seconds during restart
- 🔙 **Rollback**: Use snapshot backups in Admin Portal → Backups

## Configuration

Update `app/routers/admin.py` line 86 to set your GitHub repo:

```python
"https://api.github.com/repos/YOUR_ORG/YOUR_REPO/releases/latest"
```

Replace `YOUR_ORG` and `YOUR_REPO` with your actual GitHub organization and repository name.
