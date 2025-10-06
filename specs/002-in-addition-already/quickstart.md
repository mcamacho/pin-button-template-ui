# Quickstart: GitHub Pages Deployment

**Feature**: GitHub Pages Deployment
**Date**: 2025-10-06
**Time to Complete**: ~15 minutes

## Prerequisites

- [x] Repository hosted on GitHub
- [x] GitHub Actions enabled for repository
- [x] Write access to repository settings
- [x] Application builds successfully locally (`npm run build`)
- [x] Vite configuration uses relative paths (`base: './'`)

## Step 1: Enable GitHub Pages (2 minutes)

1. Navigate to repository **Settings** → **Pages**
2. Under **Source**, select **"GitHub Actions"**
3. Click **Save**

**Verification**: Settings page shows "Source: GitHub Actions"

## Step 2: Create Deployment Workflow (5 minutes)

1. Create directory: `.github/workflows/`
2. Create file: `.github/workflows/deploy.yml`
3. Copy content from `specs/002-in-addition-already/contracts/github-actions-workflow.yml`
4. Commit and push to main branch

**Verification**: Workflow file visible in `.github/workflows/deploy.yml`

## Step 3: Verify Workflow Execution (3 minutes)

1. Navigate to repository **Actions** tab
2. Find "Deploy to GitHub Pages" workflow run
3. Wait for workflow to complete (~2-3 minutes)
4. Check that all steps show green checkmarks

**Expected Steps**:
- ✅ Checkout
- ✅ Setup Node
- ✅ Install dependencies
- ✅ Build
- ✅ Setup Pages
- ✅ Upload artifact
- ✅ Deploy to GitHub Pages

**Verification**: Workflow status shows "✅ Success"

## Step 4: Access Deployed Application (1 minute)

1. In workflow run, find **Deploy to GitHub Pages** step
2. Click to expand and find deployment URL
3. Or navigate to **Settings** → **Pages** to find URL
4. Open URL in browser

**Expected URL Format**: `https://<username>.github.io/<repository-name>/`

**Verification**: Application loads correctly with all features working

## Step 5: Test localStorage Persistence (2 minutes)

1. Navigate to deployed application URL
2. Create a new session (click "New" button)
3. Add some button configurations
4. Save the session (click "Save" button)
5. Refresh the page
6. Verify session persists and appears in "Load Session" dropdown

**Verification**: Session data survives page refresh

## Step 6: Test Automatic Deployment (2 minutes)

1. Make a small change to a source file (e.g., update app title in `index.html`)
2. Commit and push to main branch
3. Navigate to **Actions** tab
4. Verify new workflow run triggers automatically
5. Wait for deployment to complete
6. Refresh deployed application URL
7. Verify change appears

**Verification**: Changes automatically deployed to live site

## Success Criteria

All checkpoints must pass:

- ✅ GitHub Pages enabled and configured for GitHub Actions
- ✅ Workflow file exists at `.github/workflows/deploy.yml`
- ✅ Initial workflow run completes successfully
- ✅ Application accessible at public GitHub Pages URL
- ✅ All application features work correctly (canvas, drag-drop, print)
- ✅ Sessions persist in localStorage across page refreshes
- ✅ Subsequent pushes to main branch trigger automatic deployment
- ✅ Relative asset paths work correctly (CSS, JS, images load)

## Troubleshooting

### Build Fails in GitHub Actions

**Symptoms**: Workflow fails at "Build" step

**Solutions**:
1. Check that `npm run build` works locally
2. Verify `package-lock.json` is committed
3. Check TypeScript errors in Actions logs
4. Ensure all dependencies in `package.json`

### Deployment Succeeds but Site Shows 404

**Symptoms**: Workflow succeeds but URL returns 404

**Solutions**:
1. Wait 1-2 minutes for CDN propagation
2. Verify GitHub Pages source is "GitHub Actions" not "Branch"
3. Check repository is public (or GitHub Pro for private repos)
4. Hard refresh browser (Ctrl+Shift+R)

### Assets Not Loading (404 for CSS/JS)

**Symptoms**: Page loads but styles/scripts missing

**Solutions**:
1. Verify `vite.config.ts` has `base: './'`
2. Check `index.html` uses relative paths (`./assets/...` not `/assets/...`)
3. Rebuild application with `npm run build`
4. Verify `dist/index.html` contains `./assets/` references

### localStorage Not Persisting

**Symptoms**: Sessions lost on page refresh

**Solutions**:
1. Check browser console for errors
2. Verify browser allows localStorage (not in private/incognito mode)
3. Check that DatabaseService uses localStorage adapter
4. Verify no errors in browser console during save

### Workflow Doesn't Trigger

**Symptoms**: Push to main but no workflow runs

**Solutions**:
1. Verify workflow file is on main branch (not feature branch)
2. Check that changed files match `paths` filter in workflow
3. Verify GitHub Actions enabled for repository
4. Check repository Actions tab for disabled workflows

## Validation Commands

Run these commands to verify deployment readiness:

```bash
# Verify build works locally
npm run build

# Check dist/ output
ls -la dist/

# Verify relative paths in output
grep -r 'src="' dist/index.html
# Expected: src="./assets/index-*.js"

# Verify workflow file exists
ls -la .github/workflows/deploy.yml

# Verify Vite configuration
grep 'base:' vite.config.ts
# Expected: base: './',
```

## Next Steps

After successful deployment:

1. **Share URL**: Copy deployment URL and share with stakeholders
2. **Custom Domain** (optional): Configure custom domain in repository settings
3. **Monitor Deployments**: Check Actions tab for deployment history
4. **Test Edge Cases**: Try quota exceeded, build failures, concurrent pushes

## Rollback Procedure

If deployment introduces bugs:

1. Identify last working commit SHA
2. Revert problematic commit: `git revert <commit-sha>`
3. Push to main branch
4. Wait for automatic redeployment (~2-3 minutes)
5. Verify application works correctly

**Note**: Previous version automatically preserved when build fails (no manual rollback needed for build failures).

## Support Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [localStorage API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
