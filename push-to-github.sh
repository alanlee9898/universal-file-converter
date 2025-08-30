#!/bin/bash

echo "🚀 Universal File Converter - GitHub Push Script"
echo "==============================================="
echo ""

if [ -z "$1" ]; then
    echo "❌ Please provide your GitHub Personal Access Token"
    echo ""
    echo "Usage: ./push-to-github.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "To get a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Name: 'Universal File Converter'"
    echo "4. Select scope: 'repo'"
    echo "5. Copy the token and use it here"
    echo ""
    exit 1
fi

TOKEN=$1
echo "🔐 Setting up authentication..."

# Update remote URL with token
git remote set-url origin https://alanlee9898:$TOKEN@github.com/alanlee9898/universal-file-converter.git

echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your Universal File Converter is now on GitHub!"
    echo "🔗 Repository: https://github.com/alanlee9898/universal-file-converter"
    echo ""
    echo "🚀 Next step: Create your first release"
    echo "   ./release.sh 1.0.0"
    echo ""
    echo "This will trigger automatic builds for:"
    echo "   - Linux (AppImage, .deb, .rpm)"
    echo "   - Windows (.exe installer)"
    echo "   - macOS (.dmg)"
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
fi
