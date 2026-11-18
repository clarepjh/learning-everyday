# Learning Everyday — decisions

## Confirmed

- Application title: **Learning Everyday**.
- Visual style: default.
- MVP editor: Markdown textarea with preview; defer rich-text editing.
- Subject deletion: only when empty; no archive flow in MVP.
- Import: preview, skip matching IDs, and reject malformed input.
- Separate staging/test accounts are approved; Vercel deployment remains gated on release approval.

## Still to resolve privately or explicitly

- Decide whether import is all-or-nothing or may report partial success. Recommendation: validate the entire backup before writing and avoid silent partial imports.
- Recovery/contact email and owner-account provisioning method must be selected and entered only in the private account setup flow. Never commit or post the email or credentials.

## Configuration note

The approved plan uses Vite. Its default client-exposed environment variable prefix is `VITE_`; use the placeholder names in `.env.example`. The previously shared `NEXT_PUBLIC_` names are not the standard Vite prefix. No actual project URL or key is stored in this repository.
