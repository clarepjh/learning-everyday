# Coding standards

- Keep `App.tsx` focused on session routing. Put feature screens and dialogs in their corresponding `src/components/` folders.
- Put standalone frontend helpers in `src/helpers/`, grouped by purpose. Keep component state and event handlers in their owning components.
- Use named imports from `lodash-es` when they make checks or lookups clearer. Keep straightforward comparisons and strict validation explicit; do not use Lodash to change what an existing check accepts.
