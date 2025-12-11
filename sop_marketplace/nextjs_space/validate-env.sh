#!/bin/bash
# Environment Variables Validation Script
# Usage: ./validate-env.sh [production|development]

MODE=${1:-development}

echo "Running environment validation for: $MODE"
cd "$(dirname "$0")" && tsx scripts/validate-env.ts --mode=$MODE
