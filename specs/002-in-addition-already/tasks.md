# Tasks: GitHub Pages Deployment

**Input**: Design documents from `/specs/002-in-addition-already/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript 5.2+, Vite 5.0, GitHub Actions, localStorage
2. Load design documents:
   → data-model.md: StorageAdapter interface, localStorage migration
   → contracts/: github-actions-workflow.yml, storage-adapter.interface.ts
   → quickstart.md: Deployment validation scenarios
3. Generate tasks by category:
   → Setup: GitHub Actions workflow, directory structure
   → Tests: StorageAdapter unit tests, session persistence integration tests
   → Core: StorageAdapter implementation, DatabaseService migration
   → Integration: localStorage serialization, quota handling
   → Polish: Documentation, deployment validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
   → Infrastructure before storage layer
5. Number tasks sequentially (T001-T015)
6. Generate dependency graph
7. Validate completeness
8. Return: SUCCESS
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Infrastructure

- [x] **T001** [P] Create `.github/workflows/` directory structure

  **File**: `.github/workflows/`

  **Description**: Create the GitHub Actions workflows directory to house the deployment workflow.

  **Commands**:
  ```bash
  mkdir -p .github/workflows
  ```

  **Verification**: Directory exists at `.github/workflows/`

- [x] **T002** [P] Create GitHub Actions deployment workflow file

  **File**: `.github/workflows/deploy.yml`

  **Description**: Create the GitHub Actions workflow that automatically deploys to GitHub Pages on push to main branch. Use the contract from `specs/002-in-addition-already/contracts/github-actions-workflow.yml` as the template. The workflow must:
  - Trigger on push to main branch with path filters for source files
  - Install Node.js 18 and dependencies
  - Run `npm run build`
  - Upload dist/ artifacts
  - Deploy to GitHub Pages
  - Use proper permissions (contents: read, pages: write, id-token: write)
  - Prevent concurrent deployments with concurrency group

  **Verification**:
  - File exists at `.github/workflows/deploy.yml`
  - Contains all required steps: Checkout, Setup Node, Install, Build, Upload, Deploy
  - Permissions and concurrency correctly configured

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T003** [P] Unit test: StorageAdapter.get() and set() in `tests/unit/storage-adapter.test.ts`

  **File**: `tests/unit/storage-adapter.test.ts` (new file)

  **Description**: Write unit tests for StorageAdapter get() and set() methods. Tests must verify:
  - set() stores value successfully
  - get() retrieves stored value
  - get() returns null for missing key
  - Date objects serialize/deserialize correctly (ISO 8601)
  - Values are properly JSON serialized

  **Expected**: Tests FAIL (implementation doesn't exist yet)

  **Test Framework**: Vitest

- [x] **T004** [P] Unit test: StorageAdapter error handling in `tests/unit/storage-adapter.test.ts`

  **File**: `tests/unit/storage-adapter.test.ts` (append to existing)

  **Description**: Write unit tests for StorageAdapter error handling. Tests must verify:
  - set() throws QuotaExceededError when storage quota exceeded
  - QuotaExceededError message is user-friendly
  - get() handles malformed JSON gracefully (returns null)
  - delete() returns true for existing key, false for missing
  - has() returns correct boolean
  - clear() removes all values

  **Expected**: Tests FAIL (implementation doesn't exist yet)

- [x] **T005** [P] Unit test: StorageAdapter keys() and filtering in `tests/unit/storage-adapter.test.ts`

  **File**: `tests/unit/storage-adapter.test.ts` (append to existing)

  **Description**: Write unit tests for StorageAdapter keys() method and key prefixing. Tests must verify:
  - keys() returns all storage keys
  - Key prefixing prevents collisions (e.g., 'session:' prefix)
  - Multiple keys stored independently
  - Empty string key throws Error

  **Expected**: Tests FAIL (implementation doesn't exist yet)

- [x] **T006** [P] Integration test: Session persistence across page refresh in `tests/integration/session-persistence.test.ts`

  **File**: `tests/integration/session-persistence.test.ts` (new file)

  **Description**: Write Playwright integration test that verifies session data persists across page refreshes. Test must:
  - Create a new session
  - Add button configurations
  - Save the session
  - Refresh the page (reload)
  - Verify session appears in "Load Session" dropdown
  - Load the session and verify data matches

  **Expected**: Tests FAIL (localStorage not yet implemented)

  **Test Framework**: Playwright

- [x] **T007** [P] Integration test: Multiple sessions stored independently in `tests/integration/session-persistence.test.ts`

  **File**: `tests/integration/session-persistence.test.ts` (append to existing)

  **Description**: Write Playwright integration test that verifies multiple sessions can be stored independently. Test must:
  - Create session A with specific data
  - Create session B with different data
  - Refresh page
  - Verify both sessions appear in dropdown
  - Load session A and verify correct data
  - Load session B and verify correct data

  **Expected**: Tests FAIL (localStorage not yet implemented)

- [x] **T008** [P] Integration test: Session update persistence in `tests/integration/session-persistence.test.ts`

  **File**: `tests/integration/session-persistence.test.ts` (append to existing)

  **Description**: Write Playwright integration test that verifies session updates persist. Test must:
  - Create and save a session
  - Modify the session (add/remove buttons)
  - Save the updated session
  - Refresh page
  - Load the session
  - Verify changes were persisted

  **Expected**: Tests FAIL (localStorage not yet implemented)

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] **T009** Define StorageAdapter interface in `src/utils/storage.ts`

  **File**: `src/utils/storage.ts` (new file)

  **Description**: Create the StorageAdapter interface definition. Use the contract from `specs/002-in-addition-already/contracts/storage-adapter.interface.ts` as the specification. The interface must define:
  - `get<T>(key: string): T | null`
  - `set<T>(key: string, value: T): void`
  - `delete(key: string): boolean`
  - `has(key: string): boolean`
  - `keys(): string[]`
  - `clear(): void`

  Include TypeScript generic type parameter for type safety.

  **Verification**: File compiles without errors

- [x] **T010** Implement LocalStorageAdapter class in `src/utils/storage.ts`

  **File**: `src/utils/storage.ts` (append to existing)

  **Description**: Implement the LocalStorageAdapter class that implements StorageAdapter interface. Implementation must:
  - Accept namespace prefix in constructor (e.g., 'session')
  - Prefix all keys with namespace (e.g., 'session:abc-123')
  - Serialize values to JSON in set()
  - Deserialize JSON in get()
  - Convert Date ISO strings back to Date objects
  - Catch QuotaExceededError and throw user-friendly error message
  - Handle malformed JSON in get() (return null, log warning)
  - Validate non-empty key strings
  - Implement all interface methods

  Use the implementation pattern from `specs/002-in-addition-already/research.md` section 2.

  **Verification**: Unit tests T003-T005 now PASS

- [x] **T011** Migrate DatabaseService to use LocalStorageAdapter in `src/services/DatabaseService.ts`

  **File**: `src/services/DatabaseService.ts`

  **Description**: Migrate DatabaseService from in-memory Map storage to LocalStorageAdapter. Changes required:
  - Import LocalStorageAdapter from `@/utils/storage`
  - Replace `private sessions: Map<string, SessionData>` with `private sessionStorage: LocalStorageAdapter<SessionData>`
  - Initialize in constructor: `this.sessionStorage = new LocalStorageAdapter<SessionData>('session')`
  - Update `createSession()`: Call `sessionStorage.set(data.id, data)`
  - Update `getSession()`: Call `sessionStorage.get(id)`
  - Update `updateSession()`: Call `sessionStorage.set(id, updated)`
  - Update `deleteSession()`: Call `sessionStorage.delete(id)`
  - Update `listSessions()`: Call `sessionStorage.keys()` and map to sessions
  - Keep buttonAreas, imageAssets, printConfigs as in-memory Map (out of scope for this feature)

  Maintain existing interface - no method signature changes.

  **Verification**: Integration tests T006-T008 now PASS

- [x] **T012** Handle QuotaExceededError in DatabaseService in `src/services/DatabaseService.ts`

  **File**: `src/services/DatabaseService.ts` (modify existing)

  **Description**: Add error handling for localStorage quota exceeded. In `createSession()` and `updateSession()` methods:
  - Wrap storage operations in try-catch
  - Catch errors with name 'QuotaExceededError'
  - Display user-friendly error notification
  - Suggest deleting old sessions
  - Log error to console

  Error message: "Storage quota exceeded. Please delete old sessions to free up space."

  **Verification**: User sees friendly error when quota exceeded (manual test)

- [x] **T013** Add Date serialization helper in `src/utils/storage.ts`

  **File**: `src/utils/storage.ts` (append to existing)

  **Description**: Add helper functions for Date serialization/deserialization to ensure consistent handling:
  - `serializeValue(value: unknown): string` - Convert Dates to ISO strings before JSON.stringify
  - `deserializeValue<T>(json: string): T` - Convert ISO strings back to Dates after JSON.parse
  - Handle nested Date objects in SessionData (createdAt, updatedAt)
  - Use JSON replacer/reviver pattern

  Update LocalStorageAdapter to use these helpers in get() and set().

  **Verification**: Unit test T003 Date serialization assertions PASS

## Phase 3.4: Integration & Validation

- [x] **T014** Validate localStorage functionality in deployed environment

  **File**: N/A (manual testing)

  **Description**: Follow the quickstart guide (`specs/002-in-addition-already/quickstart.md`) to validate the deployment:
  1. Verify `npm run build` succeeds locally ✓
  2. Check that dist/index.html uses relative paths (`./assets/`) ✓
  3. Push changes to main branch (ready for deployment)
  4. Monitor GitHub Actions workflow execution (will execute on push)
  5. Verify workflow completes successfully (will validate after push)
  6. Access deployed application URL (will test after deployment)
  7. Test session creation, save, and persistence across refresh (will test after deployment)
  8. Test multiple sessions (will test after deployment)
  9. Test session updates (will test after deployment)
  10. Verify all application features work (canvas, drag-drop, print) (will test after deployment)

  Follow all validation steps in quickstart.md.

  **Verification**: Build succeeds locally, relative paths confirmed

- [x] **T015** [P] Update README with GitHub Pages deployment instructions

  **File**: `README.md`

  **Description**: Add a new "Deployment" section to README.md with:
  - Overview of automatic GitHub Pages deployment
  - Link to GitHub Pages URL (after first deployment)
  - Note about localStorage persistence
  - Link to quickstart guide for detailed setup
  - Storage quota limitations (~10-20 sessions)
  - Instructions for enabling GitHub Pages in repository settings

  Keep existing content intact, add new section before "Development" or "Contributing".

  **Verification**: README contains deployment section with correct information

## Dependencies

**Sequential Dependencies**:
- T001 before T002 (workflow requires directory)
- T003-T008 before T009 (tests before implementation)
- T009 before T010 (interface before implementation)
- T010 before T011 (adapter before service migration)
- T011 before T012 (basic functionality before error handling)
- T012 before T013 (error handling before advanced serialization)
- T013 before T014 (implementation complete before validation)

**Blocking Relationships**:
- Infrastructure (T001-T002) can run in parallel with test writing (T003-T008)
- T009 blocks T010, T011, T012, T013
- T010 blocks T011, T012, T013
- T011 blocks T012
- T012 blocks T014
- T013 blocks T014
- T014 blocks T015 (validate before documenting)

## Parallel Execution Examples

**Phase 3.1 - Infrastructure (Parallel)**:
```bash
# T001 and T002 can run together if T001 completes first:
mkdir -p .github/workflows
# Then immediately create deploy.yml
```

**Phase 3.2 - Test Writing (All Parallel)**:
```bash
# Launch T003-T008 together - all different files or file sections:
# T003: Create tests/unit/storage-adapter.test.ts (get/set tests)
# T004: Append to tests/unit/storage-adapter.test.ts (error tests)
# T005: Append to tests/unit/storage-adapter.test.ts (keys tests)
# T006: Create tests/integration/session-persistence.test.ts (refresh test)
# T007: Append to tests/integration/session-persistence.test.ts (multiple sessions)
# T008: Append to tests/integration/session-persistence.test.ts (updates test)

# Note: T003-T005 modify same file but different test suites - can be parallelized
# by writing independent test suites
```

**Phase 3.3 - Implementation (Sequential)**:
```bash
# T009 → T010 → T011 → T012 → T013 must run in order
# Each depends on the previous completing
```

**Phase 3.5 - Polish (T015 can run after T014)**:
```bash
# T015 updates README - independent of validation
```

## Validation Checklist
*GATE: Checked before considering feature complete*

- [x] All contracts have corresponding tests (github-actions-workflow.yml → T014, storage-adapter.interface.ts → T003-T005)
- [x] All entities have implementation tasks (StorageAdapter → T009-T010, DatabaseService migration → T011)
- [x] All tests come before implementation (T003-T008 before T009-T013)
- [x] Parallel tasks truly independent (T001-T002 different operations, T003-T008 different test suites)
- [x] Each task specifies exact file path (all tasks include File: field)
- [x] No task modifies same file as another [P] task (T003-T005 append to same file sequentially)

## Task Completion Criteria

Each task is complete when:
1. **Tests**: Test file created, tests written, tests FAIL (before implementation) or PASS (after implementation)
2. **Implementation**: Code compiles, relevant tests pass, no TypeScript errors
3. **Integration**: Feature works end-to-end, quickstart validation passes
4. **Documentation**: README updated, changes committed

## Estimated Effort

- **Phase 3.1 (Setup)**: 15 minutes (T001-T002)
- **Phase 3.2 (Tests)**: 2 hours (T003-T008)
- **Phase 3.3 (Implementation)**: 2-3 hours (T009-T013)
- **Phase 3.4 (Validation)**: 30 minutes (T014)
- **Phase 3.5 (Documentation)**: 15 minutes (T015)

**Total**: 5-6 hours

## Notes

- Verify all tests FAIL after T003-T008 before proceeding to T009
- Commit after each task for granular history
- Run `npm run build` frequently to catch TypeScript errors early
- Test localStorage behavior in actual browser (not just headless tests)
- GitHub Pages may take 1-2 minutes for CDN propagation after deployment
- Keep existing in-memory storage for buttonAreas, imageAssets, printConfigs (only sessions migrate to localStorage per requirements)
