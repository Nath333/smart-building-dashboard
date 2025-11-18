# Branch Organization & Deployment Strategy

## Current Branch Structure

### Production Branch
- **`main`** - Production-ready code
  - Protected branch
  - Deploys to GitHub Pages automatically
  - Merge feature branches via Pull Requests only

### Feature Branches
- **`claude/javascript-gh-pages-*`** - Active development branch
  - Latest improvements and features
  - JavaScript conversion complete
  - GitHub Pages deployment configured
  - Mock data fallback implemented
  - **Ready to merge to main**

### Legacy Branches
- ~~`claude/improve-frontend-backend-integration-*`~~ - Original feature branch (superseded)
  - Use `claude/javascript-gh-pages-*` instead

## Deployment Workflow

### Automatic Deployment

The GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on:
1. Push to `main` branch
2. Push to any `claude/*` branch
3. Manual workflow dispatch

### Deployment Process

```
┌─────────────┐
│  Push Code  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ GitHub Actions  │
│  - npm install  │
│  - npm build    │
│  - Deploy       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  GitHub Pages   │
│  Live at:       │
│  /smart-build…  │
└─────────────────┘
```

## Merging Strategy

### How to Merge Feature Branch to Main

Since `main` is protected, you cannot push directly. Use Pull Requests:

1. **On GitHub**:
   - Go to repository → Pull Requests → New Pull Request
   - Base: `main` ← Compare: `claude/javascript-gh-pages-*`
   - Create and merge the PR

2. **Via CLI** (if you have permissions):
   ```bash
   # Checkout main
   git checkout main

   # Merge feature branch
   git merge claude/javascript-gh-pages-01DG4tKYPRsLGvCTj5uzdD3C

   # Push to main
   git push origin main
   ```

3. **Result**:
   - GitHub Actions deploys to GitHub Pages
   - Live site updates at `https://Nath333.github.io/smart-building-dashboard/`

## Branch Cleanup

After merging to `main`, clean up old branches:

```bash
# Delete local branch
git branch -d claude/improve-frontend-backend-integration-01DG4tKYPRsLGvCTj5uzdD3C

# Delete remote branch (if needed)
git push origin --delete claude/improve-frontend-backend-integration-01DG4tKYPRsLGvCTj5uzdD3C
```

## GitHub Pages Configuration

### One-Time Setup

1. Repository Settings → Pages
2. Source: **GitHub Actions**
3. Save

That's it! Future pushes automatically deploy.

### Deployment Status

Check deployment status:
- GitHub Actions tab → "Deploy to GitHub Pages" workflow
- Green checkmark = successful deployment
- Red X = failed (check logs)

## Current Status

✅ **JavaScript Conversion**: Complete
✅ **Mock Data Fallback**: Implemented
✅ **GitHub Actions Workflow**: Configured
✅ **Branch Organization**: Clean and documented
✅ **README**: Updated with deployment instructions
⏳ **Merge to Main**: Ready (create PR on GitHub)
⏳ **GitHub Pages**: Needs one-time Pages setup

## Quick Reference

| Task | Command |
|------|---------|
| View branches | `git branch -a` |
| Switch to feature branch | `git checkout claude/javascript-gh-pages-01DG4tKYPRsLGvCTj5uzdD3C` |
| Check deployment status | Visit GitHub Actions tab |
| View live site | `https://Nath333.github.io/smart-building-dashboard/` |

## Next Steps

1. **Enable GitHub Pages**: Settings → Pages → Source: GitHub Actions
2. **Create Pull Request**: Merge `claude/javascript-gh-pages-*` to `main`
3. **Verify Deployment**: Check GitHub Actions and live site
4. **Clean Up**: Delete old feature branches

---

**Last Updated**: 2025-11-18
**Current Branch**: `claude/javascript-gh-pages-01DG4tKYPRsLGvCTj5uzdD3C`
**Status**: Ready for production deployment
