# How to Create v4.0.0 Release on GitHub

The v4.0.0 tag has been pushed to GitHub, but the release needs to be created manually.

## Quick Steps

### Option 1: Using GitHub Web Interface (Easiest)

1. **Go to the Releases Page**
   - Navigate to: https://github.com/alsersugasawa/family-tree-app/releases/new
   - Or: Go to your repo → Click "Releases" → Click "Draft a new release"

2. **Configure the Release**
   - **Choose a tag:** Select `v4.0.0` from the dropdown (it should already exist)
   - **Release title:** `🚀 v4.0.0 - Major Release`
   - **Describe this release:** Copy and paste the content from `.github/RELEASE_NOTES_v4.0.0.md`

3. **Publish**
   - Check "Set as the latest release"
   - Click "Publish release"

### Option 2: Using GitHub CLI (if you have it installed)

```bash
# Install GitHub CLI (if not installed)
# macOS:
brew install gh

# Authenticate
gh auth login

# Create the release
gh release create v4.0.0 \
  --title "🚀 v4.0.0 - Major Release" \
  --notes-file .github/RELEASE_NOTES_v4.0.0.md \
  --latest
```

### Option 3: Using cURL (GitHub API)

```bash
# Set your GitHub token (create one at: https://github.com/settings/tokens)
export GITHUB_TOKEN="your_personal_access_token_here"

# Create the release
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/alsersugasawa/family-tree-app/releases \
  -d @- <<'EOF'
{
  "tag_name": "v4.0.0",
  "name": "🚀 v4.0.0 - Major Release",
  "body": "$(cat .github/RELEASE_NOTES_v4.0.0.md)",
  "draft": false,
  "prerelease": false
}
EOF
```

## Verify the Release

After creating the release:

1. **Check the Releases page:**
   - https://github.com/alsersugasawa/family-tree-app/releases
   - You should see "🚀 v4.0.0 - Major Release" as the latest release

2. **Verify the tag:**
   - The release should be linked to the v4.0.0 tag
   - Tag should point to commit `d7a8ca3`

3. **Check GitHub Actions:**
   - Go to: https://github.com/alsersugasawa/family-tree-app/actions
   - The major-release workflow might run (depending on configuration)
   - If it runs, it will build and publish Docker images

## What's Included in v4.0.0

### 🎨 Theme System
- Light, Dark, and System Default modes
- CSS variables for smooth transitions
- localStorage persistence
- Real-time system preference detection

### ✨ Enhanced UI/UX
- Context menu for tree nodes (right-click)
- Diagram toolbar with zoom/export controls
- Consolidated export options
- Removed Import CSV feature

### 🤖 Automated Release System
- Three-tier GitHub Actions workflows
- Automatic version updates
- Intelligent changelog generation
- In-app update system with backups

### 📚 Documentation
- NEW: USER_GUIDE.md (comprehensive guide)
- Updated README.md and CHANGELOG.md
- Complete release documentation

## Files Changed

**Modified (9):**
- CHANGELOG.md
- README.md
- app/routers/admin.py
- static/admin-styles.css
- static/admin.html
- static/admin.js
- static/app.js
- static/index.html
- static/styles.css

**New (1):**
- USER_GUIDE.md

## Troubleshooting

### Release not appearing?
- Make sure you selected the correct tag (v4.0.0)
- Check that the tag exists: `git tag -l v4.0.0`
- Verify tag was pushed: `git ls-remote --tags origin | grep v4.0.0`

### GitHub Actions workflow not running?
- The major-release workflow triggers on tag push matching `v[0-9]+.0.0`
- Check the workflow file: `.github/workflows/major-release.yml`
- View workflow runs: https://github.com/alsersugasawa/family-tree-app/actions

### Need to update the release?
- Go to the release page
- Click "Edit release"
- Update the description
- Click "Update release"

## Next Steps After Release

1. ✅ Test the application locally
2. ✅ Deploy to production (if applicable)
3. ✅ Announce the release to users
4. ✅ Monitor for any issues
5. ✅ Check admin portal update feature works

---

**Need Help?**
- GitHub Releases documentation: https://docs.github.com/en/repositories/releasing-projects-on-github
- Create Personal Access Token: https://github.com/settings/tokens
