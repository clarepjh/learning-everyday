# STUDY HARD — Implementation Plan and Team Handoffs

## Stack decision
- **Vite + React + TypeScript** for a static frontend build (no bespoke backend needed for MVP).
- **MUI** for components and responsive UI.
- **Supabase JS client**, Supabase Auth (email/password), PostgreSQL, and **RLS**. Browser calls Supabase using its publishable key; Postgres policies enforce access.
- **Vercel** for free-tier personal project hosting. Configure deep-link rewrite if using client-side routes.
- Use an established Markdown renderer plus sanitization/safe HTML handling, chosen and reviewed by the Technical Lead before installation. Never interpolate Markdown directly into raw HTML unsanitized.
- Basic testing with Vitest + React Testing Library for logic/components, plus Playwright for key E2E flows **if feasible**. Keep security policy testing independent of frontend.

## Responsibility / ownership
| Agent | Owns | Cannot do without approval |
|---|---|---|
| Technical Lead | Task breakdown, architectural decisions, interface contracts, integration check | Implement production code or merge/deploy |
| Frontend | `src/components`, `src/pages`, UI state/hooks, styles, UI tests | Change RLS, database migration, auth policy |
| Backend & Auth | `supabase/migrations`, `src/lib/supabase*`, data access layer, auth wiring, schema/policies | Embed secret keys, loosen security, deploy without owner |
| QA & Security Reviewer | Test cases, QA artifacts, security verification and review reports | Weaken tests or approve their own unverified changes |

Cross-domain files require agreeing contracts first; one owner modifies each shared file per task. Specialist agents are called when relevant, not all for every small change.

## Phase 0 — Repo and decisions (Lead + Human)
- Create private GitHub repo and initial README / `.gitignore` / env example.
- Owner creates accounts/projects; agent never requests credential dumps.
- Lead produces short contract: TypeScript types, routes, data schema, mutation return/error shape.
- Select minimal libraries; approve implementation boundaries and first task.
- **Gate:** Owner approves schema and scope.

## Phase 1 — Data & authentication (Backend/Auth)
- Add versioned SQL migration for subjects, notes, study_logs, relationships and indexes.
- Enable RLS for every relevant table with ownership policies on SELECT, INSERT, UPDATE, DELETE. Ensure references to subject/note IDs also belong to current user; use composite references, policy checks or validated application operations as appropriate.
- Configure initial owner account privately; turn off public signups; expose no sign-up UI.
- Implement Supabase client, session handling and typed data access methods.
- Add auth and policy verification procedure using test accounts only.
- **Gate:** QA approves anonymous and second-user denial tests before real notes are added.

## Phase 2 — Core UI (Frontend)
- Implement sign-in screen and protected navigation.
- Implement dashboard subjects, notes list, create/edit/delete screens, Markdown preview, code formatting.
- Add daily logs and revision flag/view; search and filters.
- Handle empty, loading, validation, network errors and mobile layouts.
- **Gate:** Demo notes CRUD + daily log on a fresh browser session.

## Phase 3 — Backup/import (Backend/Auth + Frontend)
- Define `schemaVersion: 1` JSON with subjects, notes, logs and metadata (no auth secrets).
- Export only the signed-in user's records through RLS-protected queries.
- Import with strict shape/size validation, preview counts, deduplication and referential mapping. Do not accept imported owner ID as authority; use current authenticated user.
- Clarify partial-failure semantics (prefer prevalidation and a transaction via safe DB function when needed; otherwise explicit report and no silent partial success).
- **Gate:** QA runs export, delete/reimport in disposable test data and verifies completeness.

## Phase 4 — QA and deploy (QA, Lead, Human)
- Run scripted tests in `03_TEST_AND_SECURITY_PLAN.md`.
- Verify preview deployment, env variables, production auth redirects, mobile behaviour, and session security.
- Human approves deployment in Vercel and confirms backup policy.
- **Gate:** no P0 failures or unknown unauthorized access; documented unresolved P1 issues.

## Git and communication
- One issue/task + short-lived branch per feature, PR into `main`.
- Each bot's output: **scope | files changed | tests executed & results | risks/blockers | next action** (<= 200 words unless code review needs detail).
- Do not ask all bots to rescan the full repository. Lead provides relevant file paths and approved contracts in task messages.
- Secrets go into Supabase/Vercel dashboards or local `.env.local`, never commits.

## Definition of done for each feature
- PRD acceptance criteria verified; functional and negative tests where applicable.
- Relevant lint/typecheck/build/tests pass (actual commands derived from package scripts).
- Security impact assessed and RLS checked if data/auth changes.
- Mobile and desktop checked for UI changes.
- PR lists evidence, modified files, assumptions and migration instructions; human approves merge.

## AI integration boundary (future only)
Keep notes/data logic separate from rendering. If AI is added later, introduce a separate server-side AI proxy with user authentication, rate limits, costs and explicit consent. Do not add API keys or an AI chat placeholder that silently calls APIs in this MVP.
