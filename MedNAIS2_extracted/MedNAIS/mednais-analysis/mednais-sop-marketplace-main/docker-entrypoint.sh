#!/bin/sh
set -e

echo "========================================"
echo "MedNAIS SOP Marketplace - Starting..."
echo "========================================"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start FastAPI backend in background
echo "Starting FastAPI backend on port 8001..."
cd /app/backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cd /app

# Give backend a moment to start
sleep 2

# Start Next.js server
echo "Starting Next.js server on port 3000..."
exec node server.js
