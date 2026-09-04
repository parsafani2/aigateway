# Contributing to AI Gateway

Thank you for your interest in contributing to the AI Gateway project! This document outlines the process for contributing code, reporting issues, and suggesting improvements.

## Getting Started

1. Fork the repository and clone your fork locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The app will be available at `http://localhost:5173`.

## Development Workflow

### Code Style

- Use TypeScript for all new code. Avoid `any` types — provide explicit types for function parameters and return values.
- Follow the existing file organization pattern: pages in `src/pages/`, components in `src/components/`, contexts in `src/contexts/`, utilities in `src/lib/`.
- Use the `@/` path alias for imports (e.g., `@/components/Charts`), not deep relative paths.
- Use Tailwind CSS classes for styling. Do not install additional UI theme packages.
- Use `lucide-react` for icons. Do not add other icon libraries.
- Match the existing design system: 8px spacing, cyan/blue primary colors, slate neutrals, dark/light theme support.
- Write no comments unless the "why" is non-obvious. Well-named identifiers explain the "what".

### Translation Keys

All user-facing text must use the i18n system. Add new keys to both `en` and `fa` sections in `src/i18n.ts`. Never hardcode user-facing strings.

### Database Changes

- Use the Supabase MCP `apply_migration` tool for all DDL operations (CREATE TABLE, ALTER, RLS policies).
- Every new table must have RLS enabled with appropriate policies.
- Never use destructive operations (DROP, DELETE columns, rename tables).
- Make migrations idempotent using `IF NOT EXISTS` / `DROP POLICY IF EXISTS`.

### Building and Testing

Before submitting a pull request:

1. Run the build to verify compilation:
   ```bash
   npm run build
   ```
2. Run the linter:
   ```bash
   npm run lint
   ```
3. Run type checking:
   ```bash
   npm run typecheck
   ```
4. Test your changes in the browser — verify both light and dark themes, and both English and Persian languages.

### Pull Request Process

1. Create a feature branch from `main`: `git checkout -b feature/your-feature-name`.
2. Make your changes with clear, focused commits.
3. Update the CHANGELOG.md with your changes under the `[Unreleased]` section.
4. Ensure the build, lint, and typecheck all pass.
5. Write a clear PR description explaining what changed and why.

### Reporting Issues

When reporting issues, include:
- A clear title and description.
- Steps to reproduce the behavior.
- Expected behavior vs. actual behavior.
- Screenshots if applicable.
- Browser and OS information.

## Project Structure

```
src/
  components/     # Reusable UI components (Charts, CommandPalette, NotificationsBell)
  contexts/        # React context providers (AppContext)
  lib/             # Utility libraries (supabase client)
  pages/           # Page-level components (Dashboard, Providers, etc.)
  types.ts         # TypeScript type definitions
  i18n.ts          # Translation strings (English + Persian)
  App.tsx          # Main app with navigation and routing
  main.tsx         # Entry point
  index.css        # Global styles and Tailwind directives
supabase/
  functions/       # Edge functions (ai-gateway proxy)
  migrations/      # Database migration SQL files
  config.toml      # Supabase configuration
```

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
