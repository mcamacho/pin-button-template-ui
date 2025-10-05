
# Implementation Plan: Pin Button Layout Designer

**Branch**: `001-build-an-ui` | **Date**: 2025-10-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/mk/test/pin-button-template-ui/specs/001-build-an-ui/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Pin Button Layout Designer is a desktop application for creating printable layouts of pin button designs on Letter-sized pages. Users can drag and drop images into circular button areas (default 2.75" diameter), configure button sizes and content through modals, adjust image positioning and zoom for cropping, and print layouts directly. Built with Vite, vanilla HTML/CSS/TypeScript, and SQLite for session management.

## Technical Context
**Language/Version**: TypeScript (latest stable) with Vite build tool
**Primary Dependencies**: Minimal - Vite (dev server/build), SQLite (data storage)
**Storage**: SQLite database for layout sessions, image metadata, and user preferences
**Testing**: Vitest for unit tests, Playwright for integration testing
**Target Platform**: Desktop web application (Electron wrapper potential)
**Project Type**: single - frontend application with embedded database
**Performance Goals**: 60fps UI interactions, <100ms response for layout changes
**Constraints**: Minimal dependencies, print-quality image handling, session persistence
**Scale/Scope**: Single-user desktop application, layouts up to 20 buttons per page

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality Standards**: ✅ TypeScript provides type safety, Vite supports linting integration
**Testing Requirements**: ✅ Vitest for unit tests, Playwright for integration tests (TDD approach)
**UX Consistency**: ✅ Single design system for button layout, consistent interaction patterns
**Performance Standards**: ✅ 60fps target aligns with <16ms render requirement
**Component Architecture**: ✅ Modular components (ButtonArea, Modal, Canvas) with typed interfaces

**Initial Assessment**: PASS - No constitutional violations identified

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->
```
src/
├── components/
│   ├── ButtonArea.ts
│   ├── Canvas.ts
│   ├── Modal.ts
│   └── PrintButton.ts
├── models/
│   ├── ButtonArea.ts
│   ├── Session.ts
│   └── ImageAsset.ts
├── services/
│   ├── DatabaseService.ts
│   ├── PrintService.ts
│   └── ImageService.ts
├── utils/
│   ├── layout.ts
│   └── print.ts
└── main.ts

tests/
├── unit/
│   ├── components/
│   ├── models/
│   └── services/
└── integration/
    ├── drag-drop.test.ts
    ├── modal-config.test.ts
    └── print.test.ts

public/
├── index.html
└── styles.css
```

**Structure Decision**: Single project structure chosen. Frontend-only application with embedded SQLite database. Components are organized by type (components/, models/, services/) following the component architecture principle. Tests mirror source structure for maintainability.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database Service contract → SQLite setup and model tests [P]
- Image Service contract → canvas processing and validation tests [P]
- Print Service contract → browser print integration tests [P]
- Component interfaces → UI component and interaction tests [P]
- Each entity (ButtonArea, Session, ImageAsset) → model creation task [P]
- Each user story from quickstart → integration test scenario

**Ordering Strategy**:
- TDD order: All tests before any implementation
- Dependency order: Database/Models → Services → Components → Integration
- Mark [P] for parallel execution (independent files and modules)
- UI components can be developed in parallel after service layer

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md
- Setup: 3-4 tasks (Vite config, TypeScript, SQLite)
- Tests First: 12-15 tasks (contract tests, model tests, integration tests)
- Core Implementation: 10-12 tasks (services, models, components)
- Integration & Polish: 6-8 tasks (UI assembly, print integration, validation)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS - All designs follow constitutional principles
- [x] All NEEDS CLARIFICATION resolved via user-provided technical specifications
- [x] Complexity deviations documented: None identified

**Artifact Status**:
- [x] research.md: Technical decisions documented with rationale
- [x] data-model.md: Complete entity definitions with SQLite schema
- [x] contracts/: 4 interface contracts covering all services
- [x] quickstart.md: User acceptance scenarios and development setup
- [x] CLAUDE.md: Agent context updated with project details

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
