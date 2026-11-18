# STUDY HARD — MVP handoff for OpenBot

**Project:** Private, cross-device learning notebook. **Status:** Planning; no code has been approved yet.

## Read in this order
1. `01_PRODUCT_REQUIREMENTS.md` — definitive MVP scope and acceptance criteria.
2. `02_IMPLEMENTATION_PLAN.md` — architecture, phased delivery, ownership, and handoffs.
3. `03_TEST_AND_SECURITY_PLAN.md` — mandatory verification and release gate.
4. `04_OPENBOT_AGENTS_AND_PROMPTS.md` — four agent personas and copy/paste kickoff messages.
5. `05_HUMAN_SETUP_CHECKLIST.md` — actions that require the owner to log into external services.

## Agent organization
- **Technical Lead / Orchestrator:** plans, agrees contracts, coordinates and consolidates; does not implement by default.
- **Frontend Developer:** React + TypeScript + MUI UI, accessible editor and responsive navigation.
- **Backend & Auth Developer:** Supabase schema, RLS, auth, CRUD integration, export logic.
- **QA & Security Reviewer:** tests behaviour, probes authorization and checks deployment readiness; independent of implementation.

Only the Technical Lead starts. Other agents act when assigned a scoped phase. OpenBot agents in a shared channel must not be assumed to coordinate or share state automatically.

## Release constraints
- No OpenAI API or chat integration in MVP.
- Authentication required; single privately invited/created account; no public self-registration.
- Private notes **must** be protected by database RLS, not merely hidden behind a login screen.
- One owner uses the app on phone and laptop; data persists in Supabase.
- No passwords, secret/service-role keys, connection strings or personal notes in Git or agent chat logs.
- No direct pushes to production or deploys without the owner's approval.

## Source of truth and decisions
Use the requirements in `01_PRODUCT_REQUIREMENTS.md`. If a feature conflicts with the security rules, pause and flag it. If an assumption is needed, record it in a short decision log and request human approval when consequential.

## Suggested sequence
**Gate 0:** Owner provisions GitHub and Supabase, decides public title, approves data model and scope. **Gate 1:** Architecture/schema + security review. **Gate 2:** Authentication and core CRUD. **Gate 3:** UI, editing, search, and bookmarks. **Gate 4:** QA, backup restore verification, deployment. Each gate requires evidence and human approval before moving on.

## External references
- Supabase React: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase security checklist: https://supabase.com/docs/guides/security/production-checklist
- Vercel Vite: https://vercel.com/docs/frameworks/frontend/vite
