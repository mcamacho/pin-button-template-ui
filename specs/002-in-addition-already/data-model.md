# Data Model: GitHub Pages Deployment

**Feature**: GitHub Pages Deployment
**Date**: 2025-10-06

## Overview

This feature primarily involves CI/CD infrastructure rather than application data models. The only data model change is migrating session storage from in-memory to localStorage.

## Modified Entities

### StorageAdapter (New Interface)

**Purpose**: Abstract storage mechanism to enable localStorage-backed persistence

**Fields**:
- N/A (interface/adapter pattern, no persistent fields)

**Methods**:
```typescript
interface StorageAdapter<T> {
  get(key: string): T | null
  set(key: string, value: T): void
  delete(key: string): void
  keys(): string[]
  clear(): void
}
```

**Lifecycle**:
- Instantiated: On application initialization
- Updated: On every session save/load operation
- Destroyed: N/A (persists in browser)

**Validation Rules**:
- Keys must follow pattern: `session:{sessionId}`
- Values must be valid JSON-serializable SessionData
- Must handle QuotaExceededError gracefully

**Relationships**:
- Used by: DatabaseService
- Stores: SessionData objects

### SessionData (Existing, No Changes)

**Purpose**: Represents a pin button layout session

**Fields** (unchanged):
- `id: string` - Unique session identifier (UUID)
- `name: string` - User-friendly session name
- `createdAt: Date` - Session creation timestamp
- `updatedAt: Date` - Last modification timestamp
- `buttonAreas: ButtonAreaData[]` - Array of button configurations
- `printConfig?: PrintConfigurationData` - Optional print settings

**Storage Changes**:
- **Before**: Stored in `Map<string, SessionData>` (in-memory, volatile)
- **After**: Stored in localStorage with key `session:{id}` (persistent)

**Serialization**:
- Dates serialized as ISO 8601 strings
- Deserialized back to Date objects on retrieval
- Images stored as base64 data URLs (already implemented)

## Configuration Entities

### GitHub Actions Workflow Configuration

**Purpose**: Define automated deployment pipeline

**File**: `.github/workflows/deploy.yml`

**Key Configuration**:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
    paths: [src/**, public/**, index.html, vite.config.ts, package*.json]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest

    steps:
      - Checkout code
      - Setup Node.js 18
      - Install dependencies (npm ci)
      - Build application (npm run build)
      - Configure GitHub Pages
      - Upload build artifacts from dist/
      - Deploy to GitHub Pages
```

**Validation Rules**:
- Must specify `pages: write` and `id-token: write` permissions
- Must use `ubuntu-latest` runner
- Build must succeed before deployment
- Concurrency group prevents parallel deployments

## Data Migration

### localStorage Migration Strategy

**Scenario**: User has existing in-memory sessions from local development

**Strategy**: No migration needed
- New deployments start with empty localStorage
- Local development sessions are temporary and not migrated
- Users recreate sessions on deployed version (acceptable UX trade-off per clarifications)

**Future Enhancement** (out of scope):
- Export/import functionality to transfer sessions between environments

### Backward Compatibility

**API Compatibility**: DatabaseService interface unchanged
- `createSession()` - Works identically with localStorage
- `getSession()` - Works identically with localStorage
- `updateSession()` - Works identically with localStorage
- `deleteSession()` - Works identically with localStorage
- `listSessions()` - Works identically with localStorage

**Client Code**: No changes required
- Services and components use DatabaseService interface
- Storage mechanism transparent to consumers

## Storage Constraints

### localStorage Limits

**Quota**: ~5-10MB per origin (browser-dependent)

**Estimated Usage**:
- Session metadata: ~500 bytes per session
- Button configuration: ~200 bytes per button area
- Images (base64): ~50KB per 2.25" circular button image
- **Total per session**: ~500KB (10 buttons with images)
- **Capacity**: ~10-20 sessions with images

**Quota Handling**:
```typescript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (e) {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') {
    // Display user-friendly error
    throw new Error('Storage quota exceeded. Please delete old sessions.');
  }
  throw e;
}
```

## Data Flow

### Session Persistence Flow

```
User Action (Save)
  → DatabaseService.updateSession()
  → StorageAdapter.set()
  → localStorage.setItem()
  → Browser disk storage

User Action (Load)
  → DatabaseService.getSession()
  → StorageAdapter.get()
  → localStorage.getItem()
  → JSON.parse()
  → Session object
```

### Deployment Data Flow

```
Code Push to main
  → GitHub Actions triggered
  → npm ci (install dependencies)
  → npm run build (TypeScript + Vite)
  → dist/ artifacts created
  → Upload to GitHub Pages artifact storage
  → Deploy to GitHub Pages CDN
  → Public URL updated
```

## Security Considerations

### localStorage Security

**Domain Isolation**: Sessions stored per origin (`https://<username>.github.io`)
- Sessions not shared across different GitHub Pages sites
- XSS attacks limited to same origin

**Data Exposure**: localStorage is client-side storage
- No sensitive user data (PII, passwords, payment info)
- Session data is button layouts and images - considered non-sensitive
- Users responsible for image content

**Mitigation**:
- No localStorage access in deployed production build
- Content Security Policy (CSP) prevents unauthorized script injection
- HTTPS enforced by GitHub Pages

## Testing Requirements

### Storage Adapter Tests

**Unit Tests** (`tests/unit/storage-adapter.test.ts`):
- ✅ Store and retrieve session data
- ✅ Handle missing keys (return null)
- ✅ Delete sessions
- ✅ List all session keys
- ✅ Handle QuotaExceededError gracefully
- ✅ Serialize/deserialize dates correctly
- ✅ Handle malformed JSON

**Integration Tests** (`tests/integration/session-persistence.test.ts`):
- ✅ Create session, refresh page, verify persistence
- ✅ Update session, verify changes persisted
- ✅ Delete session, verify removal
- ✅ Multiple sessions stored independently

### Deployment Tests

**GitHub Actions Validation**:
- ✅ Workflow triggers on push to main with source file changes
- ✅ Workflow skips on docs-only changes
- ✅ Build failure prevents deployment
- ✅ Successful build deploys to GitHub Pages
- ✅ Deployed site accessible via public URL
- ✅ All assets load correctly (relative paths work)

## Summary

This feature introduces minimal data model changes:
1. **StorageAdapter interface** - Abstraction for localStorage
2. **GitHub Actions workflow** - Deployment configuration (YAML, not data model)
3. **No changes to existing SessionData, ButtonAreaData, or PrintConfigurationData models**

The primary work is infrastructure (CI/CD) rather than application data modeling.
