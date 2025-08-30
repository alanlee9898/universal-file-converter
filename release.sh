#!/bin/bash

echo "🚀 Universal File Converter Release Script"
echo "=========================================="

# Check if version is provided
if [ -z "$1" ]; then
    echo "❌ Please provide a version number"
    echo "Usage: ./release.sh 1.0.1"
    exit 1
fi

VERSION=$1
echo "📦 Preparing release for version $VERSION"

# Update package.json version
echo "📝 Updating package.json version..."
npm version $VERSION --no-git-tag-version

# Build the application
echo "🏗️  Building application..."
npm run export

# Create git tag
echo "🏷️  Creating git tag..."
git add package.json
git commit -m "Release version $VERSION"
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push to GitHub (this will trigger the build workflow)
echo "📤 Pushing to GitHub..."
git push origin main
git push origin "v$VERSION"

echo ""
echo "✅ Release $VERSION initiated!"
echo "   - GitHub Actions will build for all platforms"
echo "   - Release will be created automatically"
echo "   - Check: https://github.com/your-username/universal-file-converter/actions"
echo ""
echo "📋 Next steps:"
echo "   1. Wait for builds to complete (~10-15 minutes)"
echo "   2. Edit release notes on GitHub"
echo "   3. Announce on social media"
echo "   4. Submit to package managers"
