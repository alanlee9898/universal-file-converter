# 🚀 GitHub Setup Guide - Universal File Converter

## Step 1: Create GitHub Repository

1. Go to https://github.com/alanlee9898
2. Click "New repository" (green button)
3. Repository name: `universal-file-converter`
4. Description: `Privacy-first file conversion tool - convert files locally with desktop app support`
5. Make it **Public** (recommended for open source)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Push Your Code

After creating the repository on GitHub, run these commands:

```bash
# Navigate to your project
cd /home/code/file-converter

# Push to GitHub (you'll be prompted for credentials)
git push -u origin main
```

### Authentication Options:

#### Option A: Personal Access Token (Recommended)
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with `repo` permissions
3. Use your GitHub username and the token as password when prompted

#### Option B: GitHub CLI (Alternative)
```bash
# Install GitHub CLI if not available
curl -fsSL https://cli.github.com/packages/githubkey.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh

# Authenticate and push
gh auth login
git push -u origin main
```

## Step 3: Enable GitHub Actions

After pushing, GitHub Actions will automatically be enabled. The workflow will:
- Build for Linux, Windows, and macOS
- Create releases when you push git tags
- Generate AppImage, .deb, .rpm, .exe, .dmg files

## Step 4: Create Your First Release

```bash
# Create and push a release tag
./release.sh 1.0.0
```

This will:
1. Update package.json version
2. Create git tag
3. Push to GitHub
4. Trigger automatic builds
5. Create GitHub release with binaries

## Step 5: Monitor Build Progress

1. Go to https://github.com/alanlee9898/universal-file-converter/actions
2. Watch the build progress
3. Builds typically take 10-15 minutes
4. Once complete, releases will be available at:
   https://github.com/alanlee9898/universal-file-converter/releases

## What You'll Get

### Automatic Builds:
- **Linux**: AppImage, .deb, .rpm packages
- **Windows**: .exe installer and portable version
- **macOS**: .dmg and .zip (requires macOS runner)

### Repository Features:
- Professional README with screenshots
- Comprehensive documentation
- Issue templates for bug reports
- GitHub Actions for CI/CD
- Release automation

### Distribution Ready:
- Snap Store submission ready
- Microsoft Store compatible
- Homebrew formula ready
- Package manager configurations

## Troubleshooting

### If push fails:
1. Make sure you created the repository on GitHub
2. Check your GitHub credentials
3. Try using a personal access token instead of password

### If builds fail:
1. Check GitHub Actions logs
2. Most common issues are dependency conflicts
3. The workflow is configured to handle cross-platform builds

## Next Steps After Setup

1. **Test the builds** - Download and test the generated packages
2. **Update README** - Add screenshots and demo GIFs
3. **Create releases** - Use semantic versioning (1.0.0, 1.0.1, etc.)
4. **Submit to stores** - Follow the publishing guide
5. **Share your work** - Post on social media, Reddit, Product Hunt

## Repository URL
Once created: https://github.com/alanlee9898/universal-file-converter

## Quick Commands Reference

```bash
# Check git status
git status

# Create new release
./release.sh 1.1.0

# Build locally
./build-desktop.sh

# Start development
./start-electron.sh

# View remote
git remote -v
```

Your Universal File Converter is ready to become a popular open-source project! 🚀
