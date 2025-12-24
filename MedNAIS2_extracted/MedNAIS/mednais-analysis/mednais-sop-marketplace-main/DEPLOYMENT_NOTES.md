# Deployment Notes - MedNAIS SOPs

## Important: PostgreSQL Setup

This application uses **PostgreSQL** as its database (not MongoDB). Due to container limitations, PostgreSQL needs to be initialized on each container restart.

### Quick Start

Run the initialization script after any container restart:

```bash
/app/init_services.sh
```

This script will:
1. Install PostgreSQL if not present
2. Start PostgreSQL service
3. Create the database and user
4. Run all Prisma migrations

### Manual Setup (if needed)

If the init script doesn't work, follow these steps:

```bash
# 1. Install PostgreSQL
apt-get update && apt-get install -y postgresql postgresql-contrib

# 2. Start PostgreSQL
service postgresql start

# 3. Create database and user
sudo -u postgres psql << 'EOF'
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE mednais_sops OWNER postgres;
\q
EOF

# 4. Run migrations
cd /app && npx prisma migrate deploy

# 5. Restart Next.js
sudo supervisorctl restart nextjs
```

## Database Connection

The application is configured to connect to PostgreSQL at:
- **Host**: localhost
- **Port**: 5432
- **Database**: mednais_sops
- **User**: postgres
- **Password**: postgres

Connection string in `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mednais_sops?schema=public"
```

## Authentication

The app uses **custom JWT authentication** (not NextAuth) with three providers:

1. **Magic Link (Email)** - Working ✅
   - Dev mode: Links logged to console and displayed in UI
   - Production: Requires SMTP credentials

2. **Google OAuth** - Needs configuration ⏳
   - Requires `GOOGLE_CLIENT_ID` in `.env`

3. **Apple Sign In** - Needs configuration ⏳
   - Requires `APPLE_CLIENT_ID` in `.env`

## AI SOP Generation

The AI-powered SOP generation feature uses:
- OpenAI GPT-5 (via `emergentintegrations` library)
- Python script: `/app/scripts/process_document.py`
- API endpoint: `/api/sops/generate-from-file`

Requires `OPENAI_API_KEY` in `.env` (already configured).

## Key Services

- **Next.js**: Port 3000 (managed by supervisor)
- **FastAPI Proxy**: Port 8001 (managed by supervisor)
- **PostgreSQL**: Port 5432 (manual start required)
- **MongoDB**: Port 27017 (managed by supervisor, not used)

## Troubleshooting

### "Failed to send magic link" error

This means PostgreSQL is not running. Run:
```bash
/app/init_services.sh
```

### Check PostgreSQL status
```bash
pg_isready -h localhost -p 5432
```

### View Next.js logs
```bash
tail -f /var/log/supervisor/nextjs.err.log
tail -f /var/log/supervisor/nextjs.out.log
```

### View database tables
```bash
sudo -u postgres psql -d mednais_sops -c "\dt"
```

## Production Checklist

Before deploying to production:

- [ ] Add SMTP credentials for magic link emails
- [ ] Configure Google OAuth client ID
- [ ] Configure Apple Sign In client ID  
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Set up proper PostgreSQL hosting (not local)
- [ ] Update `DATABASE_URL` to production database
- [ ] Remove FastAPI proxy (if platform supports direct Next.js routing)

## Notes

- The FastAPI proxy (`/app/backend/server.py`) is a workaround for Kubernetes ingress routing
- It forwards all requests from port 8001 to Next.js on port 3000
- Has 120s timeout for AI generation endpoints
- All custom auth tables are properly migrated and working
