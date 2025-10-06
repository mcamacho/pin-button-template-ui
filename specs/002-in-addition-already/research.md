# Phase 0: Research & Technical Decisions

**Feature**: GitHub Pages Deployment
**Date**: 2025-10-06

## Research Questions Addressed

### 1. GitHub Actions Workflow for Vite + GitHub Pages

**Decision**: Use official `actions/deploy-pages@v4` with Vite build step

**Rationale**:
- Official GitHub action ensures compatibility and security updates
- Vite's built-in static asset handling works seamlessly with GitHub Pages
- Base path configuration (`base: './'`) already set in vite.config.ts for subdirectory support
- Workflow can validate build success before deployment (FR-008, FR-009)

**Alternatives Considered**:
- Manual deployment via `gh-pages` npm package: Requires additional dependency and manual triggering
- Third-party actions (peaceiris/actions-gh-pages): Less official support, additional maintenance burden
- Custom shell script deployment: More complex, harder to maintain, no built-in failure handling

**Best Practices**:
- Use `actions/configure-pages@v4` to set up GitHub Pages configuration
- Use `actions/upload-pages-artifact@v3` to upload build artifacts
- Use `actions/deploy-pages@v4` to deploy (requires `pages: write` and `id-token: write` permissions)
- Set `concurrency` group to prevent concurrent deployments
- Run build with `npm run build` which includes TypeScript compilation and Vite bundling

### 2. localStorage for Session Persistence

**Decision**: Migrate DatabaseService from in-memory Map to localStorage-backed storage

**Rationale**:
- Browser localStorage provides persistent storage across page refreshes (FR-006)
- No backend infrastructure required (aligns with static hosting constraint)
- Simple key-value API matches existing SessionData structure
- ~5-10MB storage limit sufficient for button layout sessions
- Synchronous API simplifies migration from in-memory implementation

**Alternatives Considered**:
- IndexedDB: More complex API, overkill for simple session data
- SessionStorage: Loses data on tab close, doesn't meet persistence requirement
- Backend API: Violates static hosting constraint, adds complexity and cost

**Implementation Pattern**:
```typescript
// Wrap localStorage with typed interface
class LocalStorageAdapter {
  get(key: string): SessionData | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  set(key: string, value: SessionData): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  delete(key: string): void {
    localStorage.removeItem(key);
  }

  keys(): string[] {
    return Object.keys(localStorage).filter(k => k.startsWith('session:'));
  }
}
```

**Edge Cases**:
- QuotaExceededError: Catch and display user-friendly error message
- JSON serialization: Validate data structure before saving
- Data migration: Handle existing in-memory sessions gracefully (no migration needed for new deployment)

### 3. GitHub Pages Configuration

**Decision**: Deploy from `dist/` directory on `gh-pages` branch using GitHub Actions

**Rationale**:
- Standard GitHub Pages workflow pattern
- Separates source code (main branch) from built artifacts (gh-pages branch)
- GitHub Actions handles branch creation and management automatically
- Build artifacts not polluting main branch history

**GitHub Pages Settings Required**:
- Source: Deploy from GitHub Actions (not branch-based)
- Custom domain: Optional, not required for initial deployment
- HTTPS enforcement: Enabled by default

**URL Pattern**: `https://<username>.github.io/<repository-name>/`

**Alternatives Considered**:
- Deploy from `docs/` folder on main: Pollutes main branch with build artifacts
- Deploy from `gh-pages` branch manually: Requires manual workflow, error-prone
- Third-party hosting (Netlify, Vercel): Additional service dependency, not GitHub-native

### 4. Build Failure Handling

**Decision**: Use GitHub Actions `if: failure()` condition to prevent deployment on build errors

**Rationale**:
- Native GitHub Actions feature for conditional step execution
- Deployment step only runs if build step succeeds
- Previous deployment remains live if current build fails (FR-009)
- Build logs available in Actions tab for debugging

**Workflow Pattern**:
```yaml
jobs:
  deploy:
    steps:
      - name: Build
        run: npm run build

      - name: Upload artifact
        if: success()  # Only upload if build succeeded
        uses: actions/upload-pages-artifact@v3

      - name: Deploy
        if: success()  # Only deploy if upload succeeded
        uses: actions/deploy-pages@v4
```

### 5. Automatic Deployment Trigger

**Decision**: Use `on: push` to `main` branch with path filters

**Rationale**:
- Automatic deployment on every main branch push (FR-005)
- Path filters avoid unnecessary deployments for documentation-only changes
- Simple, predictable behavior

**Workflow Trigger**:
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'public/**'
      - 'index.html'
      - 'vite.config.ts'
      - 'package.json'
      - 'package-lock.json'
```

**Alternatives Considered**:
- Manual workflow_dispatch only: Doesn't meet automatic deployment requirement (FR-005)
- Deploy on all commits: Wastes CI minutes, unnecessary for docs-only changes
- Deploy on tags/releases only: Too restrictive, delays deployment

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| CI/CD | GitHub Actions | N/A | Automated deployment pipeline |
| Build Tool | Vite | 5.0+ | Bundle and optimize application |
| Storage | localStorage | Browser API | Session persistence |
| Hosting | GitHub Pages | N/A | Static site hosting |
| Deployment | actions/deploy-pages | v4 | Upload and deploy artifacts |

## Constraints & Requirements Validation

✅ **FR-001**: Vite build generates optimized static artifacts
✅ **FR-002**: GitHub Actions deploys to GitHub Pages
✅ **FR-003**: No application code changes break existing features
✅ **FR-004**: Vite `base: './'` ensures relative paths
✅ **FR-005**: `on: push` to main branch enables automatic deployment
✅ **FR-006**: localStorage provides browser-based persistence
✅ **FR-007**: GitHub Pages provides public, shareable URL
✅ **FR-008**: Build step validates compilation success
✅ **FR-009**: Conditional deployment prevents failed builds from deploying

## Open Questions

None. All technical decisions resolved and validated against functional requirements.
