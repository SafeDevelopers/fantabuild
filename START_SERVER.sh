#!/bin/bash
# Script to start the server with correct database configuration

cd "$(dirname "$0")/server"

echo "🔍 Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "📋 Database configuration:"
grep "^DB_" .env | head -6

echo ""
echo "🛑 Stopping any existing server..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

echo ""
echo "🚀 Starting server..."
echo "   (Press Ctrl+C to stop)"
echo ""

pnpm dev

