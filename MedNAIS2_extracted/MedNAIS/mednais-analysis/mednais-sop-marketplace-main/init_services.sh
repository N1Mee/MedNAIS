#!/bin/bash

# Script to initialize PostgreSQL service on container start
# This is needed because PostgreSQL is not in the supervisor config

echo "🔧 Initializing services..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not installed. Installing..."
    apt-get update -qq && apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
    echo "✅ PostgreSQL installed"
fi

# Start PostgreSQL if not running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "🚀 Starting PostgreSQL..."
    service postgresql start
    sleep 2
    
    # Set password for postgres user
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>&1 > /dev/null
    
    # Create database if it doesn't exist
    sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw mednais_sops
    if [ $? -ne 0 ]; then
        echo "📦 Creating database..."
        sudo -u postgres psql -c "CREATE DATABASE mednais_sops OWNER postgres;" 2>&1 > /dev/null
    fi
    
    echo "✅ PostgreSQL ready"
else
    echo "✅ PostgreSQL already running"
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
cd /app && npx prisma migrate deploy > /dev/null 2>&1
echo "✅ Database migrations complete"

echo "🎉 All services initialized!"
