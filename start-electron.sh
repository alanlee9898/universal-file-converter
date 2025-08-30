#!/bin/bash

echo "🚀 Starting Universal File Converter in Electron..."

# Check if bun is available, otherwise use npm
if command -v bun &> /dev/null; then
    PACKAGE_MANAGER="bun"
else
    PACKAGE_MANAGER="npm"
fi

echo "📦 Using $PACKAGE_MANAGER as package manager"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    $PACKAGE_MANAGER install
fi

# Start the Electron development environment
echo "⚡ Starting Electron development mode..."
echo "   This will start both Next.js and Electron"
echo "   Press Ctrl+C to stop"
echo ""

$PACKAGE_MANAGER run electron-dev
