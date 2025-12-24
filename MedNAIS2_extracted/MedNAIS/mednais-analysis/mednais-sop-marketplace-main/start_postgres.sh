#!/bin/bash
# Start PostgreSQL if not running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    service postgresql start
    sleep 2
fi
