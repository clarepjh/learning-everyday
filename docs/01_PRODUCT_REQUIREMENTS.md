# STUDY HARD — Product Requirements (MVP v1)

## 1. Purpose
A private, browser-based, responsive personal learning library where the owner manually records study sessions and saves long-form reference notes. Content must synchronize between devices after login. This is **not** an AI chat app.

## 2. User and principles
- One owner; only an authorized account can access content.
- Optimized for coding interview preparation, Java/Spring Boot, system design/AWS, and prompt engineering, but allow custom subjects.
- Designed for daily use, straightforward editing, and future migration to an AI tutor without requiring AI today.
- Works on typical laptop and mobile browser viewports; accessibility and content visibility take precedence over a no-scroll rule.

## 3. MVP user journeys
**J1 — Access:** Owner signs in with email/password, stays signed in appropriately, and signs out. Unauthenticated users cannot access notes in the UI or through direct data requests.

**J2 — Add lesson:** Owner picks subject and topic, enters title, Markdown content including fenced code blocks, tags (optional), date learned, and optionally marks for revision. Save and see content again after refresh and on a second device.

**J3 — Update and delete:** Owner edits note, including a ‘What I got wrong’ reflection, or deletes it after confirmation. UI shows success/error state and preserves unsaved edits on failure.

**J4 — Daily log:** Owner views study entries by learning date and adds short daily reflections; these may link to a related lesson but don't have to.

**J5 — Retrieve:** Owner browses subject/topic, searches notes by title and content (case-insensitive), filters by subject and revision flag, and opens a readable Markdown rendering with code formatting.

**J6 — Backup:** Owner exports all owned learning content as a downloadable JSON backup and can import it after reviewing the preview. No credentials, tokens, or auth profiles are included.

## 4. Scope / prioritization
### P0 — Required for first release
1. Email/password login and logout using Supabase Auth. Registration not available publicly; owner account provisioned through an approved secure method.
2. Private data storage in Supabase PostgreSQL, with enabled RLS and owner-scoped select/insert/update/delete policies for each exposed table.
3. Subject management (create, rename, archive/delete only where safe); sensible starter subjects without forcing hardcoded categories.
4. Notes CRUD with fields `title`, `subject_id`, `topic` (free text), `content_md`, `mistakes_md` (optional), `learned_on` (date), `needs_revision` (boolean), timestamps and ownership; tags optional but useful.
5. Daily study log CRUD with `entry_date`, `summary_md`, optional `note_id`, timestamps and ownership.
6. Browse, search, filter; empty/loading/error states.
7. Markdown read mode with highlighted code blocks if feasible with established lightweight libraries; editor may be a textarea with Markdown preview (not a heavyweight WYSIWYG editor).
8. JSON export and import with schema version, validation, preview, duplicate strategy, and safe ownership assignment on import.
9. Responsive, accessible UI on desktop and mobile.
10. Deployment to Vercel and a short owner-only operations guide.

### P1 — Later, not launch blockers
- Revision history, spaced-repetition algorithms, streaks and analytics.
- Rich WYSIWYG, drag/drop ordering, attachments, offline-first sync.
- Integrated Java execution, public sharing, multi-user collaboration.
- OpenAI chat, automated summaries, AI recommendations.

## 5. Suggested data model (subject to Lead + Backend review)
- `subjects`: id UUID, user_id UUID, name TEXT, created_at, updated_at. Unique `(user_id, name)` as appropriate.
- `notes`: id UUID, user_id UUID, subject_id UUID, title TEXT, topic TEXT, content_md TEXT, mistakes_md TEXT, learned_on DATE, needs_revision BOOLEAN, tags TEXT[] or separate tags (choose simplest), created_at, updated_at.
- `study_logs`: id UUID, user_id UUID, entry_date DATE, summary_md TEXT, note_id UUID NULL, created_at, updated_at.

Use foreign keys and checks (nonblank titles, reasonable lengths); ownership must be enforced when inserting and updating any reference. Avoid depending on client-supplied `user_id` without RLS validation. Retain all schema changes as versioned SQL migrations in Git.

## 6. Acceptance criteria
| ID | Criterion |
|---|---|
| AC-01 | Anonymous visitor sees only login; direct anonymous database reads return no private data. |
| AC-02 | Invalid password fails safely; valid owner login accesses dashboard; logout blocks protected content. |
| AC-03 | No public registration path exists, and unauthorized account access is not possible. |
| AC-04 | A note with Markdown code block can be created, read, edited, deleted and persists after refresh / across devices. |
| AC-05 | `mistakes_md` and `needs_revision` can be saved, edited and found in revision view. |
| AC-06 | Subjects can be managed without orphaning or accidentally deleting unrelated notes. |
| AC-07 | Daily log can be added, edited and listed by date. |
| AC-08 | Search/filter returns relevant notes and handles zero results gracefully. |
| AC-09 | Markdown renders safely; script injection in user-authored Markdown cannot execute. |
| AC-10 | All tables holding private data enforce RLS on each operation; one authenticated user cannot access another user's records, including via manipulated references or import. |
| AC-11 | JSON backup contains all supported learning data, is valid and downloadable; a reviewed import restores notes and logs without duplication based on declared strategy. |
| AC-12 | On phone and laptop the interface remains usable with keyboard focus, readable text and reachable actions; no data is clipped behind forced overflow. |
| AC-13 | Loading, error, unsaved-change and delete-confirmation states behave predictably. |
| AC-14 | No AI API is invoked; no paid dependency is required for normal single-user use within free-tier limits. |

## 7. Nonfunctional constraints
- No exposed Supabase secret/service-role key; only URL and **publishable key** in browser environment variables. Never paste keys into OpenBot chats.
- Enable Row Level Security explicitly on every app table in exposed schema, and verify with anonymous + unauthorized-user tests.
- Use simple dependency choices and avoid unnecessary background jobs/functions.
- Use clear loading/errors; avoid accidentally logging personal lesson contents to third-party analytics.
- Backup export is plain JSON and may contain private notes; display a privacy warning and encourage safe storage.
- Authentication is security, not hiding the site URL. Public code and login page may remain publicly viewable; private content must not be.

## 8. Human decisions before coding
1. Confirm preferred application name and visual style (default: clean, friendly, readable, no need to match portfolio aesthetic).
2. Confirm whether to use a rich editor later; MVP defaults to Markdown textarea + preview.
3. Confirm whether archive subjects or only delete empty subjects (recommended: only delete empty subjects in MVP).
4. Confirm import duplicate handling (recommended: preview and skip identical IDs; reject malformed entries).
5. Confirm which contact/recovery email to use privately; do **not** put it in Git documentation.
