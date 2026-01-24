# GitHub Actions Workflows

This directory contains automated workflows for the Family Tree application using a **reusable workflow template** architecture.

## Workflow Architecture

All release workflows now use a centralized **reusable workflow template** (`release-template.yml`) to eliminate code duplication and ensure consistency across different release types.

### Template-Based Approach Benefits
- ✅ **DRY Principle**: Single source of truth for release logic
- ✅ **Consistency**: All releases follow the same process
- ✅ **Maintainability**: Update release logic in one place
- ✅ **Type Safety**: Enforced validation for each release type

---

## Available Workflows

### 1. Test Branch Workflow
**File:** `test-branch.yml`
**Trigger:** Push to `test` branch
**Purpose:** Continuous integration for development

**What it does:**
- Runs Python linting (flake8)
- Executes test suite
- Validates Docker build
- Comments on pull requests

**Use case:** Daily development and testing

**Example:**
```bash
git checkout test
git add .
git commit -m "feat: add new feature"
git push origin test
```

---

### 2. Patch Release Workflow (Bug Fixes)
**File:** `patch-release.yml`
**Template:** Uses `release-template.yml`
**Trigger:** Tags matching `v[0-9]+.[0-9]+.[1-9]*` (e.g., v4.0.1, v4.0.2)
**Purpose:** Bug fixes and security updates

**What it does:**
- Validates patch version format (X.Y.Z where Z > 0)
- Updates APP_VERSION in code
- Generates changelog from commits
- Creates GitHub release with bug fix template
- Builds and pushes Docker images:
  - `alsersugasawa/family-tree-app:v4.0.2`
  - `alsersugasawa/family-tree-app:4.0`
  - `alsersugasawa/family-tree-app:4`
  - `alsersugasawa/family-tree-app:latest`
  - `alsersugasawa/family-tree-app:patch-latest`

**Use case:** Bug fixes, security patches, hotfixes

**Example:**
```bash
VERSION="4.0.3"
git tag -a v$VERSION -m "fix: resolve critical bug"
git push origin v$VERSION

# Or use workflow dispatch
# Actions → Patch Release → Run workflow → Enter version
```

---

### 3. Feature Release Workflow (Minor Version)
**File:** `feature-release.yml`
**Template:** Uses `release-template.yml`
**Trigger:** Tags matching `v[0-9]+.[1-9]*.[0]` (e.g., v4.1.0, v4.2.0)
**Purpose:** New features without breaking changes

**What it does:**
- Validates minor version format (X.Y.0 where Y > 0)
- Updates APP_VERSION in code
- Generates changelog with features section
- Creates GitHub release with feature template
- Builds and pushes Docker images with multiple tags

**Use case:** New features, enhancements, improvements

**Example:**
```bash
VERSION="4.1.0"
git tag -a v$VERSION -m "feat: add new dashboard features"
git push origin v$VERSION

# Or with custom release notes
# Actions → Feature Release → Run workflow
# Version: 4.1.0
# Release notes: "Added analytics dashboard"
```

---

### 4. Major Release Workflow (Breaking Changes)
**File:** `breaking-release.yml`
**Template:** Uses `release-template.yml`
**Trigger:** Tags matching `v[1-9]*.[0].[0]` (e.g., v5.0.0, v6.0.0)
**Purpose:** Major features with breaking changes

**What it does:**
- Validates major version format (X.0.0 where X > current major)
- Updates APP_VERSION in code
- Generates comprehensive changelog
- Creates detailed GitHub release with:
  - Breaking changes warning
  - Migration instructions
  - Rollback procedures
  - System requirements
- Builds and pushes Docker images:
  - `alsersugasawa/family-tree-app:v5.0.0`
  - `alsersugasawa/family-tree-app:5.0`
  - `alsersugasawa/family-tree-app:5`
  - `alsersugasawa/family-tree-app:latest`
  - `alsersugasawa/family-tree-app:major-latest`

**Use case:** Breaking API changes, major architecture updates, database schema changes

**Example:**
```bash
VERSION="5.0.0"
git tag -a v$VERSION -m "feat!: major rewrite with breaking changes"
git push origin v$VERSION

# With breaking changes documentation
# Actions → Major Release → Run workflow
# Version: 5.0.0
# Release notes: "
# Breaking Changes:
# - Removed deprecated /api/v1 endpoints
# - Changed authentication to OAuth2
# - Updated database schema
# "
```

---

## Reusable Workflow Template

**File:** `release-template.yml`

### Inputs
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Version number (e.g., 4.0.2) |
| `release_type` | string | Yes | Type: major, minor, or patch |
| `release_title` | string | No | Custom title for release |
| `release_notes` | string | No | Additional release notes |

### Secrets
| Secret | Required | Description |
|--------|----------|-------------|
| `DOCKER_USERNAME` | No | Docker Hub username |
| `DOCKER_PASSWORD` | No | Docker Hub access token |

### Jobs
1. **validate-version** - Validates semantic versioning and release type
2. **create-release** - Creates GitHub release with changelog
3. **build-docker** - Builds multi-platform Docker images
4. **notify** - Sends completion notification

---

## Workflow Comparison

| Feature | Test | Patch | Feature | Major |
|---------|------|-------|---------|-------|
| **Trigger** | Push to test | Tag v4.0.X | Tag v4.X.0 | Tag vX.0.0 |
| **Template** | No | Yes | Yes | Yes |
| **Version Change** | None | Patch (Z) | Minor (Y) | Major (X) |
| **Release Created** | No | Yes | Yes | Yes |
| **Docker Build** | Yes | Yes | Yes | Yes |
| **Docker Push** | No | Yes | Yes | Yes |
| **Multi-Arch** | No | Yes | Yes | Yes |
| **Tests** | Yes | No | No | No |
| **Breaking Warning** | No | No | No | Yes |

---

## Configuration

### Required Secrets (Optional)

For Docker Hub publishing, add these secrets in GitHub:
- Settings → Secrets and variables → Actions → New repository secret

**Secrets:**
- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub personal access token (not password!)

**To create Docker Hub token:**
1. Log in to Docker Hub
2. Account Settings → Security → New Access Token
3. Give it a descriptive name (e.g., "GitHub Actions")
4. Copy the token and add to GitHub secrets

If secrets are not set, workflows will build Docker images locally but skip the push step.

---

## Quick Reference

### Development Work
```bash
# Work on test branch
git checkout test
git add .
git commit -m "feat: add new feature"
git push origin test
# ✅ Triggers: test-branch.yml
```

### Bug Fix Release (Patch)
```bash
# From main branch
VERSION="4.0.3"
git tag -a v$VERSION -m "fix: resolve login bug"
git push origin v$VERSION
# ✅ Triggers: patch-release.yml
```

### Feature Release (Minor)
```bash
# From main branch
VERSION="4.1.0"
git tag -a v$VERSION -m "feat: add export feature"
git push origin v$VERSION
# ✅ Triggers: feature-release.yml
```

### Major Release (Breaking)
```bash
# From main branch
VERSION="5.0.0"
git tag -a v$VERSION -m "feat!: major rewrite"
git push origin v$VERSION
# ✅ Triggers: breaking-release.yml
```

### Manual Workflow Dispatch
```bash
# Via GitHub UI
# 1. Go to Actions tab
# 2. Select workflow (Patch/Feature/Major Release)
# 3. Click "Run workflow"
# 4. Enter version number
# 5. (Optional) Add release notes
# 6. Click "Run workflow"
```

---

## Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

**Format:** `MAJOR.MINOR.PATCH` (e.g., 4.2.1)

- **MAJOR** (X.0.0) - Incompatible API changes, breaking changes
- **MINOR** (4.X.0) - New features, backwards-compatible
- **PATCH** (4.2.X) - Bug fixes, backwards-compatible

### Version Increment Rules

**When to increment PATCH (4.0.1 → 4.0.2):**
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements (no API changes)

**When to increment MINOR (4.0.2 → 4.1.0):**
- New features
- New API endpoints
- Deprecated features (still supported)
- Substantial internal improvements

**When to increment MAJOR (4.1.0 → 5.0.0):**
- Breaking API changes
- Removed deprecated features
- Database schema breaking changes
- Changed authentication methods
- Incompatible configuration changes

---

## Changelog Generation

Workflows automatically generate changelogs from git commit messages. Follow these conventions:

### Commit Message Format
```
<type>: <description>

[optional body]
[optional footer]
```

### Types
- `feat:` - New feature (appears in Features section)
- `fix:` - Bug fix (appears in Bug Fixes section)
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test updates
- `chore:` - Build/tool changes
- `breaking:` - Breaking changes

### Examples
```bash
# Feature
git commit -m "feat: add user profile export to CSV"

# Bug fix
git commit -m "fix: resolve memory leak in diagram rendering"

# Breaking change
git commit -m "feat!: migrate to OAuth2 authentication

BREAKING CHANGE: API endpoints now require OAuth2 tokens instead of JWT"
```

---

## Docker Image Tags

### Tag Strategy

Each release creates multiple Docker tags for flexibility:

**Patch Release v4.0.2:**
- `v4.0.2` - Exact version
- `4.0` - Minor version alias
- `4` - Major version alias
- `latest` - Latest release
- `patch-latest` - Latest patch

**Feature Release v4.1.0:**
- `v4.1.0` - Exact version
- `4.1` - Minor version alias
- `4` - Major version alias
- `latest` - Latest release
- `minor-latest` - Latest feature

**Major Release v5.0.0:**
- `v5.0.0` - Exact version
- `5.0` - Minor version alias
- `5` - Major version alias
- `latest` - Latest release
- `major-latest` - Latest major

### Multi-Architecture Support

All releases build for multiple platforms:
- `linux/amd64` - Intel/AMD (x86_64)
- `linux/arm64` - Apple Silicon, ARM servers

---

## Troubleshooting

### Workflow Failed to Trigger
**Problem:** Pushed tag but workflow didn't run
**Solutions:**
- Check tag format matches pattern (use `git tag -l` to list)
- Verify workflows are enabled (Settings → Actions → General)
- Check Actions tab for error messages

### Version Validation Failed
**Problem:** "Invalid version format" error
**Solutions:**
- Ensure version follows X.Y.Z format
- Patch: Z must be > 0 (e.g., 4.0.1 ✅, 4.0.0 ❌)
- Minor: Z must be 0 (e.g., 4.1.0 ✅, 4.1.1 ❌)
- Major: Y and Z must be 0 (e.g., 5.0.0 ✅, 5.0.1 ❌)

### Docker Push Failed
**Problem:** "authentication required" error
**Solutions:**
- Add DOCKER_USERNAME and DOCKER_PASSWORD secrets
- Verify Docker Hub credentials are correct
- Check Docker Hub token has write permissions
- Workflows will still build locally if secrets missing

### Changelog Empty
**Problem:** Release changelog shows "Various improvements"
**Solutions:**
- Use conventional commit messages (feat:, fix:, etc.)
- Ensure commits exist between previous tag and current tag
- Check commit messages match grep patterns in workflow

---

## Best Practices

1. **Always test on `test` branch first**
   - Push to test branch
   - Wait for CI to pass
   - Then merge to main and tag

2. **Use semantic commit messages**
   - Enables automatic changelog generation
   - Helps determine version increments
   - Improves project history

3. **Create releases from main branch**
   - Ensure main is stable
   - Tag after merging test to main
   - Don't tag test branch

4. **Review changes before major releases**
   - Check for breaking changes
   - Update migration guides
   - Test in staging environment

5. **Document breaking changes**
   - Use `feat!:` or `BREAKING CHANGE:` in commits
   - Add migration instructions to release notes
   - Update USER_GUIDE.md

---

## Migration from Old Workflows

### What Changed
- **Before:** Separate `major-release.yml` and `minor-release.yml` with duplicated code
- **After:** Reusable `release-template.yml` with specialized callers

### Benefits
- 75% reduction in workflow code
- Single source of truth for release logic
- Easier to maintain and update
- Consistent behavior across release types

### Old Files (Removed)
- ❌ `major-release.yml` → ✅ `breaking-release.yml` (uses template)
- ❌ `minor-release.yml` → ✅ `patch-release.yml` (uses template)

### Migration Steps
If you have existing workflows:
1. Review `release-template.yml` for changes
2. Update any custom logic
3. Test with workflow_dispatch first
4. Delete old workflows after verification

---

## Documentation

- **This File:** Workflow reference
- **Release Process:** [../RELEASE_PROCESS.md](../RELEASE_PROCESS.md)
- **Quick Reference:** [RELEASE_QUICK_REFERENCE.md](RELEASE_QUICK_REFERENCE.md)
- **Update Guide:** [../../UPDATE_GUIDE.md](../../UPDATE_GUIDE.md)
- **Changelog:** [../../CHANGELOG.md](../../CHANGELOG.md)

---

## Support

For workflow issues:
1. Check the **Actions** tab on GitHub
2. Review workflow logs for errors
3. Verify tag format with `git tag -l`
4. Check secrets are configured (Settings → Secrets)
5. Review this README for troubleshooting

For template updates or feature requests:
1. Open an issue on GitHub
2. Describe the change needed
3. Tag with `workflow` label

---

**Last Updated:** 2026-01-24
**Template Version:** 1.0.0
