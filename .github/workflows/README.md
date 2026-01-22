# GitHub Actions Workflows

This directory contains automated workflows for the Family Tree application.

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

---

### 2. Minor Release Workflow
**File:** `minor-release.yml`
**Trigger:** Tags matching `v[0-9]+.[0-9]+.[0-9]+` (e.g., v1.0.1, v1.0.2)
**Purpose:** Bug fixes and security updates

**What it does:**
- Validates version format (must be patch version)
- Updates version in code
- Generates changelog from commits
- Creates GitHub release
- Builds and tags Docker images:
  - `latest`
  - `v1.0.2`
  - `minor-latest`

**Use case:** Bug fixes, security patches

**Example:**
```bash
git tag -a v1.0.2 -m "Bug fix release"
git push origin v1.0.2
```

---

### 3. Major Release Workflow
**File:** `major-release.yml`
**Trigger:** Tags matching `v[0-9]+.0.0` (e.g., v2.0.0, v3.0.0)
**Purpose:** Major features and breaking changes

**What it does:**
- Validates major version format (must be X.0.0)
- Updates version in code
- Generates comprehensive changelog:
  - New features
  - Bug fixes
  - Breaking changes
  - Security updates
- Creates detailed GitHub release with:
  - Installation instructions
  - Rollback procedures
  - Breaking changes warning
  - System requirements
- Builds and tags Docker images:
  - `latest`
  - `v2.0.0`
  - `v2` (major version)
  - `major-latest`

**Use case:** Major new features, breaking changes

**Example:**
```bash
git tag -a v2.0.0 -m "Major release with new features"
git push origin v2.0.0
```

---

## Workflow Comparison

| Feature | Test Branch | Minor Release | Major Release |
|---------|-------------|---------------|---------------|
| **Trigger** | Push to test | Tag v1.0.X | Tag vX.0.0 |
| **Version Change** | None | Last digit | First digit |
| **Release Created** | No | Yes | Yes |
| **Docker Build** | Yes | Yes | Yes |
| **Docker Push** | No | Yes | Yes |
| **Changelog** | No | Simple | Comprehensive |
| **Tests** | Yes | No | No |

---

## Configuration

### Required Secrets (Optional)

For Docker Hub publishing, add these secrets in GitHub:
- Settings → Secrets → Actions → New repository secret

**Secrets:**
- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub access token

If these are not set, workflows will still run but skip Docker push steps.

---

## Quick Reference

### Development Work
```bash
git checkout test
git push origin test
# Triggers: test-branch.yml
```

### Bug Fix Release
```bash
VERSION="1.0.2"
git tag -a v$VERSION -m "Bug fixes"
git push origin v$VERSION
# Triggers: minor-release.yml
```

### Major Feature Release
```bash
VERSION="2.0.0"
git tag -a v$VERSION -m "Major release"
git push origin v$VERSION
# Triggers: major-release.yml
```

---

## Documentation

- **Full Details:** [RELEASE_PROCESS.md](../RELEASE_PROCESS.md)
- **Quick Reference:** [RELEASE_QUICK_REFERENCE.md](RELEASE_QUICK_REFERENCE.md)
- **Update Guide:** [UPDATE_GUIDE.md](../UPDATE_GUIDE.md)

---

## Support

For workflow issues:
1. Check the Actions tab on GitHub
2. Review workflow logs
3. Verify tag format matches expected pattern
4. Check required secrets are configured

---

**Last Updated:** 2026-01-22
