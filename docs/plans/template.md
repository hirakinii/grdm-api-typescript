# Implementation Plan: Issue #XXX — [Title]

<!-- All contents below should be written in English. -->

## Overview

<!--
Describe in 1–3 sentences: what is being changed, why, and how.
The reader should grasp the full picture without reading further.
-->

## Background

<!--
Describe the context, constraints, and prerequisites that make this implementation necessary.
Focus on "why now" and "what is broken or missing" — avoid repeating the Overview.
-->

## Architecture

<!--
OPTIONAL: Use this section only when the structural change is significant
(e.g., infrastructure changes, large-scale refactoring, new directory layout).

Include Before/After diagrams, component architecture, directory structure,
or data flow diagrams as appropriate.
-->

## Affected Files

<!--
List all files to be created or modified, grouped by category (e.g., Backend / Frontend).

| File | Change |
|------|--------|
| `path/to/file.ts` | Brief description of change |
-->

## Detailed Design

<!--
Describe the implementation in detail, organized by subsystem or concern.
Include code snippets, interface definitions, and logic explanations as needed.

For large implementations, divide into phases using the structure below:

### Phase 1: [Phase Name]

> Priority: Highest / High / Medium / Low. One-line reason.

#### Tasks

1. ...
2. ...

### Phase 2: [Phase Name]

...
-->

## Test Plan

<!--
Describe what to test and how. Cover all applicable test types:
- Unit tests: functions, hooks, components
- Integration tests: API endpoints, DB operations
- Manual / smoke tests: step-by-step verification procedure
- E2E tests (if necessary): critical user journeys using Playwright (e.g., login → create resource → verify output)

Do not omit this section even if only a smoke test is planned.
-->

## Open Questions

<!--
OPTIONAL: Use this section only when there are unresolved decisions that must be
answered before or during implementation. Remove entries once resolved.
-->

## Completion Checklist

<!--
Define "done" for this implementation.
For phased implementations, group tasks under ### Phase N headings.
Update items from `- [ ]` to `- [x]` as work is completed.
-->

- [ ] ...
- [ ] ...
- [ ] Pass the created/updated E2E tests after deploying the frontend Docker container if necessary.
- [ ] Update a part of documents below if they are relevant to the changes in this plan:
    - [ ] documents in `docs/backend`
    - [ ] In `docs/develoment`
    - [ ] documents in `docs/frontend`
    - [ ] `README.md` in the root and each directory.
    - [ ] User manual documents in `manual-site/docs`.
