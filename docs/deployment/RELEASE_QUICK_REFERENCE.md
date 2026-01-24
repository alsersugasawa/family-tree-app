# Release Quick Reference

## TL;DR - Which Release Should I Use?

```
┌─────────────────────────────────┬──────────────────┬─────────────────┐
│ What are you doing?             │ Release Type     │ Version Example │
├─────────────────────────────────┼──────────────────┼─────────────────┤
│ Testing new code                │ Test Branch      │ No version      │
│ Bug fix                         │ Minor Release    │ v1.0.1→v1.0.2   │
│ Security patch                  │ Minor Release    │ v1.0.2→v1.0.3   │
│ Adding new feature              │ Major Release    │ v1.0.0→v2.0.0   │
│ Breaking API changes            │ Major Release    │ v2.0.0→v3.0.0   │
└─────────────────────────────────┴──────────────────┴─────────────────┘
```

---

## Test Branch (Development)

**Use when:** Just testing code, not ready for release

```bash
git checkout test
# Make changes
git add .
git commit -m "Testing new feature"
git push origin test
```

**Result:** Tests run, no release created

---

## Minor Release (Bug Fixes)

**Use when:** Fixing bugs or security issues

**Version:** Increment last number (v1.0.1 → v1.0.2)

```bash
git checkout main
# Fix bug
git add .
git commit -m "fix: resolve login timeout"

# Tag and release
VERSION="1.0.2"
sed -i "s/APP_VERSION = \".*\"/APP_VERSION = \"$VERSION\"/" app/routers/admin.py
git add app/routers/admin.py
git commit -m "Bump version to $VERSION"
git tag -a v$VERSION -m "Bug fix release"
git push origin main --tags
```

**Result:** GitHub release created, Docker images tagged

---

## Major Release (New Features)

**Use when:** Adding new features or making breaking changes

**Version:** Increment first number, reset others (v1.9.5 → v2.0.0)

```bash
git checkout main
# Add new feature
git add .
git commit -m "feat: add real-time collaboration"

# Tag and release (MUST be X.0.0 format)
VERSION="2.0.0"
sed -i "s/APP_VERSION = \".*\"/APP_VERSION = \"$VERSION\"/" app/routers/admin.py
git add app/routers/admin.py
git commit -m "🚀 Major release: v$VERSION"
git tag -a v$VERSION -m "Major release with new features"
git push origin main --tags
```

**Result:** Major release created with detailed notes, Docker images tagged

---

## One-Liner Commands

### Minor Release
```bash
VERSION="1.0.2" && sed -i "s/APP_VERSION = \".*\"/APP_VERSION = \"$VERSION\"/" app/routers/admin.py && git add app/routers/admin.py && git commit -m "fix: bug fixes" && git tag -a v$VERSION -m "v$VERSION" && git push origin main --tags
```

### Major Release
```bash
VERSION="2.0.0" && sed -i "s/APP_VERSION = \".*\"/APP_VERSION = \"$VERSION\"/" app/routers/admin.py && git add app/routers/admin.py && git commit -m "feat: new features" && git tag -a v$VERSION -m "v$VERSION" && git push origin main --tags
```

---

## Version Number Rules

```
v1.0.0
 │ │ └─ Patch (Minor Release) - Bug fixes only
 │ └─── Minor (Major Release) - New features
 └───── Major (Major Release) - Breaking changes
```

**Minor Release:** Only change last number
- ✅ v1.0.0 → v1.0.1
- ✅ v1.0.1 → v1.0.2
- ❌ v1.0.0 → v1.1.0

**Major Release:** Change first number, reset others
- ✅ v1.9.5 → v2.0.0
- ✅ v2.0.0 → v3.0.0
- ❌ v1.0.0 → v1.1.0

---

## Commit Message Tips

Use these prefixes for auto-changelog:

**Minor Release:**
- `fix:` - Bug fixes
- `security:` - Security patches

**Major Release:**
- `feat:` - New features
- `add:` - New additions
- `breaking:` - Breaking changes

---

## Troubleshooting

**Wrong tag pushed?**
```bash
git tag -d v1.0.2                    # Delete locally
git push origin :refs/tags/v1.0.2    # Delete remotely
```

**Need to re-run workflow?**
- Go to GitHub → Actions
- Select failed workflow
- Click "Re-run failed jobs"

**Workflow not triggering?**
- Check tag format matches pattern
- Minor: `v1.0.1`, `v2.3.4`
- Major: `v2.0.0`, `v3.0.0`

---

## Full Documentation

See [RELEASE_PROCESS.md](../RELEASE_PROCESS.md) for complete details.
