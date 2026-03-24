# CLAUDE.md

## Workflow

- Always run `npm run build` (or equivalent build command) after making changes to verify nothing is broken before reporting completion.

## UI Development

- When implementing UI changes, ask for clarification on scope before applying changes broadly. E.g., "center the filters" means center only the filters, not the entire parent container.

## Database

- For database schema changes (Supabase SQL), always DROP existing functions before recreating them with different return types. Check for return type conflicts proactively.
