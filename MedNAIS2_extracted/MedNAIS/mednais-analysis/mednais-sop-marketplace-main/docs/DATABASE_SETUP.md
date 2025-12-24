# Database Setup Guide

This guide explains how to set up and manage the PostgreSQL database for MedNAIS SOP Marketplace.

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Database Migrations](#database-migrations)
- [Production Setup](#production-setup)
- [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- Docker and Docker Compose installed
- Node.js and npm/yarn installed

### Steps

#### 1. Start PostgreSQL with Docker Compose

```bash
# Navigate to project root
cd /path/to/mednais-sop-marketplace-main

# Start PostgreSQL (and other services)
docker-compose up -d postgres

# Verify PostgreSQL is running
docker-compose ps
```

This will start PostgreSQL on `localhost:5432` with:
- Username: `postgres` (or value from `POSTGRES_USER` env var)
- Password: `postgres` (or value from `POSTGRES_PASSWORD` env var)
- Database: `mednais_sops` (or value from `POSTGRES_DB` env var)

#### 2. Configure Database Connection

Create or update your `.env` file:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mednais_sops?schema=public"
```

#### 3. Generate Prisma Client

```bash
# Generate TypeScript Prisma client
npx prisma generate

# Generate Python Prisma client (for backend)
cd backend
prisma generate
cd ..
```

#### 4. Run Database Migrations

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Or apply existing migrations
npx prisma migrate deploy
```

#### 5. Seed Database (Optional)

```bash
# Seed categories
npx ts-node scripts/seed_categories.ts

# Or with Python
python scripts/seed_categories.py
```

---

## Database Migrations

### Creating New Migrations

When you modify `prisma/schema.prisma`:

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Example: Adding role field to User
npx prisma migrate dev --name add_user_role
```

This will:
1. Compare schema with database
2. Generate SQL migration files
3. Apply migrations to database
4. Regenerate Prisma client

### Migration Files Location

Migrations are stored in: `prisma/migrations/`

Example structure:
```
prisma/migrations/
├── 20241211000000_init/
│   └── migration.sql
├── 20241211000001_add_user_role/
│   └── migration.sql
└── migration_lock.toml
```

### Applying Migrations in Production

```bash
# Apply all pending migrations (safe for production)
npx prisma migrate deploy
```

**Important**: Never use `migrate dev` in production!

### Resetting Database (Development Only)

```bash
# ⚠️ WARNING: This will delete all data!
npx prisma migrate reset

# This will:
# 1. Drop database
# 2. Create new database
# 3. Apply all migrations
# 4. Run seed scripts
```

---

## Production Setup

### Option 1: Managed PostgreSQL (Recommended)

Use a managed PostgreSQL service:

- **AWS RDS**: Fully managed, automatic backups
- **Supabase**: PostgreSQL + additional features
- **Heroku Postgres**: Easy setup
- **DigitalOcean Managed Databases**: Cost-effective

#### Configuration

1. Create a PostgreSQL instance
2. Get connection string
3. Update `.env`:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
```

4. Apply migrations:

```bash
npx prisma migrate deploy
```

### Option 2: Self-Hosted PostgreSQL

#### Using Docker

Create `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_prod_data:
    driver: local
```

#### Security Considerations

1. **Use strong passwords**:
   ```bash
   # Generate a strong password
   openssl rand -base64 32
   ```

2. **Enable SSL**:
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
   ```

3. **Restrict access**:
   - Use firewall rules
   - Allow only application server IPs
   - Don't expose port 5432 publicly

4. **Regular backups**:
   ```bash
   # Backup command
   pg_dump -h localhost -U postgres -F c -b -v -f backup.dump mednais_sops
   
   # Restore command
   pg_restore -h localhost -U postgres -d mednais_sops -v backup.dump
   ```

---

## Database Schema Overview

### Core Models

1. **User** - User accounts and profiles
2. **SOP** - Standard Operating Procedures
3. **Category** - SOP categories and subcategories
4. **Group** - User groups for collaboration
5. **Purchase** - Marketplace transactions

### Authentication Models

1. **AuthProvider** - OAuth providers (Google, Apple, etc.)
2. **RefreshToken** - JWT refresh tokens
3. **MagicLink** - Email magic link tokens

### Marketplace Models

1. **Purchase** - Purchase records
2. **PaymentTransaction** - Stripe payment tracking
3. **Rating** - SOP ratings and reviews
4. **PromoCode** - Discount codes

### Execution Models

1. **SOPExecution** - SOP execution tracking
2. **StepExecution** - Individual step completion

### New Additions

1. **UserRole** enum - USER, ADMIN (for role-based access control)

---

## Prisma Studio

View and edit database data with Prisma Studio:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555`

---

## Database Maintenance

### Checking Database Status

```bash
# Check Prisma schema status
npx prisma migrate status

# View database
npx prisma studio
```

### Performance Optimization

```bash
# Analyze and optimize
ANALYZE;
VACUUM;

# Check index usage
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';
```

### Monitoring

Monitor database performance:

```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Connection Issues

**Error**: "Can't reach database server"

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Migration Issues

**Error**: "Migration failed"

```bash
# Check migration status
npx prisma migrate status

# Reset migrations (development only)
npx prisma migrate reset

# Resolve migration (production)
npx prisma migrate resolve --applied "migration_name"
```

### Schema Out of Sync

**Error**: "Schema is out of sync"

```bash
# Pull current database schema
npx prisma db pull

# Or regenerate client
npx prisma generate
```

### Performance Issues

**Slow queries**:

1. Add indexes to frequently queried fields
2. Use `include` carefully in Prisma queries
3. Implement pagination
4. Use database connection pooling

---

## Important Notes

### For Development

- Use `migrate dev` for local development
- Seed data for testing
- Use Prisma Studio to inspect data

### For Production

- Always use `migrate deploy`
- Never reset database
- Implement proper backup strategy
- Monitor database performance
- Use connection pooling (e.g., PgBouncer)

### Migration Best Practices

1. **Test migrations locally first**
2. **Backup before applying migrations**
3. **Use descriptive migration names**
4. **Review generated SQL**
5. **Plan for rollbacks**

---

## Next Steps After Setup

1. ✅ Start PostgreSQL
2. ✅ Configure DATABASE_URL
3. ✅ Generate Prisma client
4. ✅ Apply migrations
5. ✅ Seed initial data
6. ✅ Verify with Prisma Studio

---

**Last Updated**: December 11, 2025
