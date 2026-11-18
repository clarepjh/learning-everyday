# STUDY HARD — QA and Security Test Plan

## Test strategy
QA owns this checklist; developer supplies test evidence. Test manually at first and automate critical regressions as practical. **No live personal notes in test fixtures.** Use synthetic accounts and synthetic content.

## Required matrix
| ID | Test case | Expected result | Priority |
|---|---|---|---|
| T01 | Logged-out visitor opens app + deep link | Login screen; no note data rendered | Critical |
| T02 | Anonymous request to notes/subjects/logs via Supabase client | No private rows returned; writes denied | Critical |
| T03 | Owner wrong password / valid login / logout | Fail safely / enter app / lose access | Critical |
| T04 | Public self-signup attempted | Disabled / unavailable as configured | Critical |
| T05 | Second valid test user requests first user's rows by ID | No read/update/delete, including foreign-key manipulation | Critical |
| T06 | Create note with title, Markdown code, subject, topic, learned date | Persists and renders accurately on refresh | High |
| T07 | Edit a note and revision flag + mistakes section | Updates persist and revision filter reflects status | High |
| T08 | Delete note (confirm and cancel paths) | Cancel preserves; confirm deletes correct note only | High |
| T09 | Subject rename and attempted deletion with notes | Safe behaviour; no unrelated data loss | High |
| T10 | Add/edit daily log, empty-state day | Correct chronological display | High |
| T11 | Search title/content with mixed case; no results | Correct matches + useful empty state | High |
| T12 | Invalid form values / network error / unauthorized response | Friendly errors, no silent loss of unsaved work | High |
| T13 | Markdown containing `<script>` and dangerous links/HTML | Never executes scripts or unsafe links | Critical |
| T14 | Export JSON with two notes and a log | Valid versioned backup with correct data; excludes auth/session keys | Critical |
| T15 | Import corrupted JSON, huge file, unknown schema version | Clear validation error; no partial corruption | High |
| T16 | Import valid backup twice | Defined duplicate strategy followed; no unintended duplication | High |
| T17 | Imported references to another user's record | Rejected or safely remapped; no cross-user linkage | Critical |
| T18 | Laptop and phone login, update then refresh | Same persisted data on both devices | High |
| T19 | Narrow mobile viewport, keyboard-only navigation, 200% zoom | Content reachable, focus visible, actions operable | High |
| T20 | No AI requests / no service secret in bundled JS or repo | No AI integration; only publishable client key | Critical |

## Security checklist
- [ ] All app tables have RLS enabled and tested for SELECT/INSERT/UPDATE/DELETE.
- [ ] Policies compare row ownership to `auth.uid()` and enforce consistent parent/reference ownership.
- [ ] Public signups disabled and no signup UI; invite/create owner securely.
- [ ] Supabase secret keys and DB credentials absent from git history, source, browser bundle, logs and PRs.
- [ ] Markdown rendered safely; verify XSS vectors and external link behavior.
- [ ] All unauthenticated screens and direct data access are restricted.
- [ ] Auth errors never reveal unnecessary account details.
- [ ] Backups are explicitly downloaded by owner and warn that plaintext content is sensitive.
- [ ] Site checks browser console for unexpected data leakage and runtime errors.

## Test data procedure
Create a *disposable* owner test account and a separate unauthorized test account in a staging/testing Supabase project when possible. Never use real passwords or personal data for automated E2E tests. Use authenticated clients for direct RLS probes; do not assume a hidden UI proves security.

## QA report format
**Build/commit:** SHA or PR link
**Environment:** local/preview/production
**Passed:** IDs
**Failed:** ID, actual vs expected, evidence and severity
**Not run:** IDs and why
**Security findings:** critical/high/medium/low
**Release recommendation:** APPROVE / REQUEST CHANGES / BLOCKED

## Release gate
Block launch for any Critical case failure, unknown RLS posture, leaked secret, broken login/logout, or inability to export data. Noncritical cosmetic issues can be recorded and deferred with human consent.
