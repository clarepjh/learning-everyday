# Learning Everyday

A private, responsive learning notebook for saving study notes and daily reflections across devices. The planning documents were prepared under the earlier working title **STUDY HARD**; this README records the current application title.

## Status

The app includes email/password sign-in, session persistence, owner-scoped subject/note/study-log CRUD, and versioned JSON backup export with preview-first, atomic restore. Public sign-up is not implemented. Apply both migrations in `supabase/migrations/`, including [`20261118105000_atomic_backup_import.sql`](supabase/migrations/20261118105000_atomic_backup_import.sql), before using backup restore. The migrations have not been verified against a live staging database. Do not store real learning notes until they are applied and the security checks in [`docs/03_TEST_AND_SECURITY_PLAN.md`](docs/03_TEST_AND_SECURITY_PLAN.md) pass.

## Project documents

- [Product requirements](docs/01_PRODUCT_REQUIREMENTS.md)
- [Implementation plan](docs/02_IMPLEMENTATION_PLAN.md)
- [QA and security test plan](docs/03_TEST_AND_SECURITY_PLAN.md)
- [Agent roles and task prompts](docs/04_OPENBOT_AGENTS_AND_PROMPTS.md)
- [Owner setup checklist](docs/05_HUMAN_SETUP_CHECKLIST.md)
- [Current decisions and open items](docs/DECISIONS.md)

## Local configuration

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key locally. `.env.local` is ignored by Git. Vite reads client-side variables prefixed with `VITE_`; never put a Supabase secret/service-role key, database password, or other credential in frontend configuration. Publishable keys are not authorization: enforce and test RLS on every private table before exposing data.

If sign-in works but the app reports `PGRST205` for `public.subjects`, check that the Supabase Dashboard project matches `VITE_SUPABASE_URL`. In that project's SQL Editor, apply the migrations that are not already installed, in order:

1. [`20261118103000_initial_learning_schema.sql`](supabase/migrations/20261118103000_initial_learning_schema.sql) creates the tables and owner-only access policies.
2. [`20261118105000_atomic_backup_import.sql`](supabase/migrations/20261118105000_atomic_backup_import.sql) adds backup restore.

If the tables already exist in `public` but the Data API still reports them missing, check that `public` is an exposed schema and reload the API schema cache with `NOTIFY pgrst, 'reload schema';` in the SQL Editor. Do not grant anonymous access to fix a schema-cache error.

## Security and release

No public self-registration, no AI integration, no production deployment, and no real personal notes until live RLS checks and the remaining release gates are complete. Treat JSON backups as sensitive because they may contain private notes.
