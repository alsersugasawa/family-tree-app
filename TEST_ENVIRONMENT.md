# Test Environment Setup

This document explains how to run a separate Docker instance for testing, keeping test data completely isolated from your development/production data.

## Overview

The test environment uses:
- **Separate Docker containers**: `familytree-db-test` and `familytree-web-test`
- **Separate database**: `familytree_test` on port 5433
- **Separate web port**: 8081 (instead of 8080)
- **Separate data volumes**: `postgres_data_test` and `backups-test/`
- **Separate network**: `familytree-test-network`

This ensures test data never mixes with your source code or development data.

## Quick Start

### 1. Start Test Environment

```bash
# Start test containers
docker-compose -f docker-compose.test.yml up -d

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Access the test application
# http://localhost:8081
```

### 2. Stop Test Environment

```bash
# Stop test containers
docker-compose -f docker-compose.test.yml down

# Stop and remove all test data (clean slate)
docker-compose -f docker-compose.test.yml down -v
```

### 3. Run Both Environments Simultaneously

```bash
# Terminal 1: Development environment (port 8080)
docker-compose up -d

# Terminal 2: Test environment (port 8081)
docker-compose -f docker-compose.test.yml up -d

# Both environments now running independently:
# - Dev: http://localhost:8080 (database on port 5432)
# - Test: http://localhost:8081 (database on port 5433)
```

## Environment Comparison

| Feature | Development | Test |
|---------|------------|------|
| Web Port | 8080 | 8081 |
| Database Port | 5432 | 5433 |
| Database Name | `familytree` | `familytree_test` |
| Container Names | `familytree-web`, `familytree-db` | `familytree-web-test`, `familytree-db-test` |
| Data Volume | `postgres_data` | `postgres_data_test` |
| Backups Directory | `./backups/` | `./backups-test/` |
| Network | `familytree-network` | `familytree-test-network` |
| Config File | `docker-compose.yml` | `docker-compose.test.yml` |
| Environment File | `.env` | `.env.test` |

## Configuration

### Test-Specific Environment Variables

The test environment uses `.env.test` with the following key differences:

```bash
# Different database
DATABASE_URL=postgresql+asyncpg://postgres:postgres_test@db-test:5432/familytree_test

# Test JWT secret (DO NOT use in production)
JWT_SECRET_KEY=test-secret-key-for-testing-only

# Test environment flag
ENVIRONMENT=test

# Different CORS origins
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081

# Relaxed security for testing
RATE_LIMIT_ENABLED=false
```

## Use Cases

### 1. Testing New Features

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Make changes to code (hot-reload enabled)
# Test at http://localhost:8081

# If tests fail, no impact on dev data
# Clean up test data
docker-compose -f docker-compose.test.yml down -v
```

### 2. Database Migration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Test migration on test database
docker-compose -f docker-compose.test.yml exec db-test psql -U postgres -d familytree_test -f /path/to/migration.sql

# Verify migration worked
# If successful, apply to dev environment
```

### 3. Load Testing / Stress Testing

```bash
# Use test environment to avoid affecting dev data
docker-compose -f docker-compose.test.yml up -d

# Run load tests against http://localhost:8081
# Monitor performance without risk to production data
```

### 4. User Acceptance Testing (UAT)

```bash
# Start fresh test environment
docker-compose -f docker-compose.test.yml up -d

# Create test users and data
# Let users test new features at http://localhost:8081

# After UAT, clean up
docker-compose -f docker-compose.test.yml down -v
```

## Database Operations

### Access Test Database

```bash
# Connect to test PostgreSQL
docker-compose -f docker-compose.test.yml exec db-test psql -U postgres -d familytree_test

# Or from host machine (if psql installed)
psql -h localhost -p 5433 -U postgres -d familytree_test
```

### Backup Test Database

```bash
# Create backup of test data
docker-compose -f docker-compose.test.yml exec db-test pg_dump -U postgres familytree_test > test-backup.sql

# Restore test data
docker-compose -f docker-compose.test.yml exec -T db-test psql -U postgres -d familytree_test < test-backup.sql
```

### Reset Test Database

```bash
# Method 1: Restart with clean slate
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d

# Method 2: Drop and recreate database
docker-compose -f docker-compose.test.yml exec db-test psql -U postgres -c "DROP DATABASE familytree_test;"
docker-compose -f docker-compose.test.yml exec db-test psql -U postgres -c "CREATE DATABASE familytree_test;"
```

## Troubleshooting

### Port Already in Use

If port 8081 or 5433 is already in use, edit `docker-compose.test.yml`:

```yaml
services:
  db-test:
    ports:
      - "5434:5432"  # Change to different port

  web-test:
    ports:
      - "8082:8000"  # Change to different port
```

### Containers Won't Start

```bash
# Check container status
docker-compose -f docker-compose.test.yml ps

# View detailed logs
docker-compose -f docker-compose.test.yml logs db-test
docker-compose -f docker-compose.test.yml logs web-test

# Restart containers
docker-compose -f docker-compose.test.yml restart
```

### Test Data Mixing with Dev Data

Ensure you're using the correct compose file:

```bash
# WRONG - uses dev environment
docker-compose up

# RIGHT - uses test environment
docker-compose -f docker-compose.test.yml up
```

### Clean Up Everything

```bash
# Stop and remove test containers, networks, and volumes
docker-compose -f docker-compose.test.yml down -v

# Remove test backup directory
rm -rf backups-test/

# Remove any leftover test containers
docker ps -a | grep test | awk '{print $1}' | xargs docker rm -f
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Wait for services
        run: |
          docker-compose -f docker-compose.test.yml exec -T web-test \
            bash -c "until curl -f http://localhost:8000/health; do sleep 1; done"

      - name: Run tests
        run: |
          # Add your test commands here
          docker-compose -f docker-compose.test.yml exec -T web-test \
            pytest tests/

      - name: Cleanup
        if: always()
        run: docker-compose -f docker-compose.test.yml down -v
```

## Best Practices

1. **Always Use Test Environment for Testing**
   - Never test experimental features on dev environment
   - Use `docker-compose.test.yml` for all testing activities

2. **Clean Up After Testing**
   - Run `docker-compose -f docker-compose.test.yml down -v` to remove test data
   - Prevents disk space issues

3. **Keep Test Configs Separate**
   - Use `.env.test` for test-specific configuration
   - Never commit real credentials to `.env.test`

4. **Document Test Scenarios**
   - Keep track of test cases in comments or separate docs
   - Makes it easy to reproduce issues

5. **Use Different Ports**
   - Test: 8081 (web), 5433 (database)
   - Dev: 8080 (web), 5432 (database)
   - Prevents port conflicts

## Additional Commands

```bash
# View test container status
docker-compose -f docker-compose.test.yml ps

# Stop test containers (keep data)
docker-compose -f docker-compose.test.yml stop

# Start stopped test containers
docker-compose -f docker-compose.test.yml start

# Rebuild test containers after code changes
docker-compose -f docker-compose.test.yml up -d --build

# View resource usage
docker stats familytree-web-test familytree-db-test

# Execute commands in test web container
docker-compose -f docker-compose.test.yml exec web-test bash

# View test application logs (last 100 lines)
docker-compose -f docker-compose.test.yml logs --tail=100 web-test
```

## Summary

The test environment provides complete isolation from your development data:

✅ **Separate containers** - No conflicts with dev environment
✅ **Separate ports** - Run both simultaneously
✅ **Separate data** - Test data in `postgres_data_test` volume
✅ **Separate backups** - Test backups in `backups-test/` directory
✅ **Easy cleanup** - Remove all test data with one command
✅ **Identical code** - Uses same codebase via volume mounts

This setup ensures your source code and development data remain pristine while allowing comprehensive testing.
