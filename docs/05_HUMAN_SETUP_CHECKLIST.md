# STUDY HARD — Human Owner Setup Checklist

The bots may guide these actions, but **you** must handle account creation, approvals and secrets. Never paste passwords or secret keys into an agent channel.

## Before development
- [ ] Create a **private GitHub repository** (suggested: `study-hard-learning-hub`).
- [ ] Upload these Markdown files to the OpenBot project and create the 4 agents listed in `04_OPENBOT_AGENTS_AND_PROMPTS.md`.
- [ ] Send the Technical Lead kickoff prompt; approve its architecture and tickets before coding.
- [ ] Create a Supabase project in your own account (Free plan is suitable initially, subject to current limits).
- [ ] Record the project URL and **publishable key** privately for app configuration. The publishable key can be used in the browser; any secret/service-role keys must remain private and never go in frontend code.
- [ ] Create your owner user via a secure admin/invitation flow, then disable public signups. Verify there is no signup UI.
- [ ] Decide your app title, initial subjects and optional colour/theme preferences.
- [ ] Confirm backup expectations: plaintext JSON backups contain your notes and must be stored securely.

## During development
- [ ] Approve SQL schema and Row Level Security rules **before** using real notes.
- [ ] Use dummy test records and test accounts. Do not upload real learning notes until security checks pass.
- [ ] Review pull requests/changes at each release gate.
- [ ] Supply environment variables via `.env.local` (ignored by Git) and later Vercel dashboard, not via commits or messages.
- [ ] Test the app from your laptop and phone in separate sessions.

## Before going live
- [ ] Create or connect a Vercel Hobby project linked to your GitHub repository.
- [ ] Configure Vercel build settings and environment variables, deploy a preview, check login redirect/deep links.
- [ ] Confirm direct anonymous reads are denied, another account cannot read your notes, and secrets are absent from the browser bundle.
- [ ] Run a JSON export and restore test using disposable data.
- [ ] Approve production deployment after QA report.
- [ ] Save a backup locally in a secure place; set a calendar reminder to export periodically.

## After launch
- [ ] Add a few real notes from prior STUDY HARD lessons.
- [ ] Confirm data syncs across devices.
- [ ] Track recurring pain points and defer AI/API integration until the manual workflow has proven useful.
- [ ] Watch free-tier usage and Supabase inactivity policies; use your own JSON exports as backups.

## Decisions to send the Technical Lead
- Preferred application title (default: `STUDY HARD`).
- Initial subjects (suggested: Algorithms, Java/Spring Boot, SQL, System Design/AWS, Prompt Engineering).
- Visual direction (default: clean, modern, light theme).
- Markdown editor choice (recommended: text editing + live preview, not rich-text in v1).
- Confirmation that there is only one real user account initially.

## Useful services
- Supabase dashboard: https://supabase.com/dashboard
- Vercel dashboard: https://vercel.com/dashboard
- GitHub: https://github.com/new
