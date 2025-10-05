# Tasks: Pin Button Layout Designer

**Input**: Design documents from `/home/mk/test/pin-button-template-ui/specs/001-build-an-ui/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✓ Found: TypeScript + Vite, SQLite, minimal dependencies
2. Load optional design documents:
   → data-model.md: 4 entities → model tasks
   → contracts/: 4 interface files → contract test tasks
   → quickstart.md: 6 test scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: Vite project init, dependencies, SQLite setup
   → Tests: contract tests, integration tests
   → Core: models (ButtonArea, Session, ImageAsset, PrintConfig), services
   → Integration: UI components, drag-drop, print functionality
   → Polish: unit tests, performance validation, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. ✓ Generated 34 tasks with dependency ordering
7. ✓ Created parallel execution examples
8. Validate task completeness:
   → ✓ All 4 contracts have tests
   → ✓ All 4 entities have model tasks
   → ✓ All 6 quickstart scenarios covered
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Based on plan.md structure decision: single frontend application

## Phase 3.1: Setup
- [x] T001 Create project structure with src/ components/ models/ services/ utils/ and tests/ directories
- [x] T002 Initialize Vite TypeScript project with package.json, tsconfig.json, and vite.config.ts
- [x] T003 [P] Install dependencies: vite, typescript, @types/node, better-sqlite3, vitest, playwright
- [x] T004 [P] Configure ESLint and Prettier for TypeScript code formatting
- [x] T005 Setup SQLite database initialization script with schema from data-model.md

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [x] T006 [P] Contract test DatabaseService interface in tests/unit/database-service.test.ts
- [x] T007 [P] Contract test ImageService interface in tests/unit/image-service.test.ts
- [x] T008 [P] Contract test PrintService interface in tests/unit/print-service.test.ts
- [x] T009 [P] Contract test CanvasComponent interface in tests/unit/canvas-component.test.ts
- [x] T010 [P] Contract test ModalComponent interface in tests/unit/modal-component.test.ts

### Integration Tests (from quickstart.md scenarios)
- [x] T011 [P] Integration test application launch and canvas display in tests/integration/app-launch.test.ts
- [x] T012 [P] Integration test image drag and drop functionality in tests/integration/drag-drop.test.ts
- [x] T013 [P] Integration test configuration modal workflow in tests/integration/modal-config.test.ts
- [x] T014 [P] Integration test image manipulation (crop, zoom, rotate) in tests/integration/image-manipulation.test.ts
- [x] T015 [P] Integration test session management (save, load, temporary) in tests/integration/session-management.test.ts
- [x] T016 [P] Integration test print functionality and browser integration in tests/integration/print.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models
- [x] T017 [P] ButtonArea model with validation in src/models/ButtonArea.ts
- [x] T018 [P] Session model with state transitions in src/models/Session.ts
- [x] T019 [P] ImageAsset model with file handling in src/models/ImageAsset.ts
- [x] T020 [P] PrintConfiguration model with constraints in src/models/PrintConfiguration.ts

### Service Layer
- [x] T021 DatabaseService implementation with SQLite operations in src/services/DatabaseService.ts
- [x] T022 ImageService implementation with canvas processing in src/services/ImageService.ts
- [x] T023 PrintService implementation with browser print API in src/services/PrintService.ts

### Utility Functions
- [x] T024 [P] Layout calculation utilities for button positioning in src/utils/layout.ts
- [x] T025 [P] Print utilities for DPI and paper size handling in src/utils/print.ts
- [x] T026 [P] Validation utilities for model constraints in src/utils/validation.ts

## Phase 3.4: UI Components
- [x] T027 CanvasComponent implementation with drag-drop support in src/components/Canvas.ts
- [x] T028 ButtonAreaComponent with image display and interaction in src/components/ButtonArea.ts
- [x] T029 ModalComponent with form controls and validation in src/components/Modal.ts
- [x] T030 PrintButtonComponent with print dialog integration in src/components/PrintButton.ts

## Phase 3.5: Application Integration
- [x] T031 Main application controller with component coordination in src/main.ts
- [x] T032 HTML structure and CSS styles with responsive design in public/index.html and public/styles.css
- [x] T033 Event system integration for component communication
- [x] T034 Error handling and user feedback system

## Phase 3.6: Polish
- [ ] T035 [P] Unit tests for utility functions in tests/unit/utils/
- [ ] T036 [P] Performance optimization for large image handling
- [ ] T037 [P] Accessibility improvements (WCAG 2.1 AA compliance)
- [ ] T038 [P] Browser compatibility testing and polyfills
- [ ] T039 Final integration testing with quickstart.md validation scenarios

## Dependencies
**Critical TDD Dependencies:**
- Setup (T001-T005) before all tests (T006-T016)
- All tests (T006-T016) before ANY implementation (T017-T039)

**Implementation Dependencies:**
- Models (T017-T020) before Services (T021-T023)
- Services (T021-T023) before Components (T027-T030)
- Components (T027-T030) before Integration (T031-T034)
- Core implementation before Polish (T035-T039)

**Specific Blockers:**
- T021 (DatabaseService) blocks T027 (CanvasComponent) - needs data persistence
- T022 (ImageService) blocks T028 (ButtonAreaComponent) - needs image processing
- T023 (PrintService) blocks T030 (PrintButtonComponent) - needs print functionality
- T027-T030 (all components) block T031 (main controller) - needs all UI elements

## Parallel Example
```bash
# Launch setup tasks together (T003-T004):
Task: "Install dependencies: vite, typescript, @types/node, better-sqlite3, vitest, playwright"
Task: "Configure ESLint and Prettier for TypeScript code formatting"

# Launch all contract tests together (T006-T010):
Task: "Contract test DatabaseService interface in tests/unit/database-service.test.ts"
Task: "Contract test ImageService interface in tests/unit/image-service.test.ts"
Task: "Contract test PrintService interface in tests/unit/print-service.test.ts"
Task: "Contract test CanvasComponent interface in tests/unit/canvas-component.test.ts"
Task: "Contract test ModalComponent interface in tests/unit/modal-component.test.ts"

# Launch all integration tests together (T011-T016):
Task: "Integration test application launch and canvas display in tests/integration/app-launch.test.ts"
Task: "Integration test image drag and drop functionality in tests/integration/drag-drop.test.ts"
Task: "Integration test configuration modal workflow in tests/integration/modal-config.test.ts"
Task: "Integration test image manipulation (crop, zoom, rotate) in tests/integration/image-manipulation.test.ts"
Task: "Integration test session management (save, load, temporary) in tests/integration/session-management.test.ts"
Task: "Integration test print functionality and browser integration in tests/integration/print.test.ts"

# Launch all model implementations together (T017-T020):
Task: "ButtonArea model with validation in src/models/ButtonArea.ts"
Task: "Session model with state transitions in src/models/Session.ts"
Task: "ImageAsset model with file handling in src/models/ImageAsset.ts"
Task: "PrintConfiguration model with constraints in src/models/PrintConfiguration.ts"

# Launch utility functions together (T024-T026):
Task: "Layout calculation utilities for button positioning in src/utils/layout.ts"
Task: "Print utilities for DPI and paper size handling in src/utils/print.ts"
Task: "Validation utilities for model constraints in src/utils/validation.ts"
```

## Notes
- [P] tasks = different files, no dependencies between them
- **CRITICAL**: Verify all tests fail before implementing (TDD requirement)
- Commit after each task completion
- Run `npm run test` after each phase to ensure no regressions
- Use quickstart.md scenarios to validate each integration test
- Maintain 60fps performance target throughout development

## Task Validation Checklist
*Completed during execution - verify each phase*

**Phase 3.1 Setup:**
- [ ] Project structure matches plan.md specifications
- [ ] All dependencies installed without conflicts
- [ ] TypeScript compilation works without errors
- [ ] SQLite database initializes with correct schema

**Phase 3.2 Tests:**
- [ ] All contract tests written and failing appropriately
- [ ] All integration test scenarios cover quickstart.md requirements
- [ ] Test runner (Vitest) configured and working
- [ ] Playwright setup for browser testing complete

**Phase 3.3 Core Implementation:**
- [ ] All models implement data-model.md specifications exactly
- [ ] All services implement contract interfaces completely
- [ ] All utilities support core functionality requirements
- [ ] Type safety maintained throughout (no `any` types)

**Phase 3.4 UI Components:**
- [ ] Canvas component handles drag-drop per quickstart scenario 2
- [ ] Modal component supports all configuration options per scenario 3
- [ ] Button areas display circular masking correctly per scenario 4
- [ ] Print button integrates with browser print API per scenario 6

**Phase 3.5 Integration:**
- [ ] Application launches successfully per quickstart scenario 1
- [ ] All components communicate through event system
- [ ] Session management works per quickstart scenario 5
- [ ] Error handling provides user-friendly feedback

**Phase 3.6 Polish:**
- [ ] Performance meets 60fps target for UI interactions
- [ ] Accessibility testing passes WCAG 2.1 AA requirements
- [ ] Browser compatibility verified across target browsers
- [ ] All quickstart.md scenarios pass end-to-end testing