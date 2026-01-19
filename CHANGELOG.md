# Changelog

All notable changes to the Family Tree App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-19

### Added
- Account Settings feature allowing users to:
  - Update email address
  - Change password
  - Delete account with cascade deletion of family tree data
- Clickable username in header that opens Account Settings modal
- Settings gear icon next to username for better UX

### Changed
- Expanded siblings display in family tree diagram
- All siblings now shown as individual nodes instead of collapsed with badge counter
- Improved tree visualization with all family members visible
- Updated header layout with integrated account settings access

### Removed
- Sibling count badge (+N indicator)
- Separate "Account Settings" button (merged with username)

## [1.0.0] - Initial Release

### Added
- User authentication (register, login, logout)
- Family member management (add, edit, delete)
- Interactive family tree visualization using D3.js
- Family tree statistics dashboard
- Relationship tracking (parents, children, siblings, partners)
- Zoom and pan controls for tree navigation
- Member details panel with full information display
- Responsive design for mobile and desktop
- PostgreSQL database with SQLAlchemy ORM
- Docker containerization with docker-compose
