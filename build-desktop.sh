#!/bin/bash

echo "🚀 Building Universal File Converter Desktop App..."

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

# Build the Next.js app
echo "🏗️  Building Next.js application..."
$PACKAGE_MANAGER run export

# Build the Electron app
echo "⚡ Building Electron desktop app..."
$PACKAGE_MANAGER run build-electron

echo "✅ Build complete! Check the dist/ directory for your desktop app."
echo ""
echo "📁 Built files:"
ls -la dist/ 2>/dev/null || echo "No dist directory found - build may have failed"

echo ""
echo "🎉 Universal File Converter desktop app is ready!"
echo "   You can find the AppImage in the dist/ directory"
