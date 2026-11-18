# Learning Everyday

A private, responsive learning notebook for saving study notes and daily reflections across devices. The planning documents were prepared under the earlier working title **STUDY HARD**; this README records the current application title.

## Status

Planning and setup only. This repository does not yet contain application code. Do not use real learning notes until authentication and database Row Level Security (RLS) have passed the security checks in [`docs/03_TEST_AND_SECURITY_PLAN.md`](docs/03_TEST_AND_SECURITY_PLAN.md).

## Project documents

- [Product requirements](docs/01_PRODUCT_REQUIREMENTS.md)
- [Implementation plan](docs/02_IMPLEMENTATION_PLAN.md)
- [QA and security test plan](docs/03_TEST_AND_SECURITY_PLAN.md)
- [Agent roles and task prompts](docs/04_OPENBOT_AGENTS_AND_PROMPTS.md)
- [Owner setup checklist](docs/05_HUMAN_SETUP_CHECKLIST.md)
- [Current decisions and open items](docs/DECISIONS.md)

## Local configuration

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key locally. `.env.local` is ignored by Git. Vite reads client-side variables prefixed with `VITE_`; never put a Supabase secret/service-role key, database password, or other credential in frontend configuration. Publishable keys are not authorization: enforce and test RLS on every private table before exposing data.

## Security and release

No public self-registration, no AI integration, no production deployment, and no real personal notes until the relevant owner approvals and release gates are complete. Treat JSON backups as sensitive because they may contain private notes.
