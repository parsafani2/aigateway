# Changelog

All notable changes to the AI Gateway project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Expanded Getting Started tutorials** — from 5 to 12 step-by-step tutorials covering every feature from zero to hero, fully bilingual (English and Persian).
- **Full Persian translations for all educational content** — tutorial steps, FAQ items, prerequisites, and code examples are now fully translated.
- **New tutorial topics**: Monitoring & Anomaly Detection, Risk Monitor & Provider Scoring, User Management & Access Control, Using the API Playground, Audit Logs & Activity Tracking, Cost Analysis & Export, Settings & Gateway Configuration.
- **Expanded FAQ** — from 8 to 12 frequently asked questions in both languages.
- **Copy response button** on the Playground page for quick clipboard access.

### Changed

- **Improved light mode color scheme** — softer background tones (slate-100 instead of slate-50), warmer card backgrounds (white/80 with softer borders), and softer heading text colors (slate-800 instead of slate-900) for a more pleasant reading experience.
- **Sidebar and header backgrounds** softened in light mode with translucent effects.
- Updated GettingStarted page to use a structured bilingual content system instead of hardcoded English strings.

### Fixed

- Fixed Playground useEffect missing dependency array — was running on every render instead of once on mount.
- Fixed type error in Cost Analysis budget form period field.
- Removed unused imports and variables across multiple pages (Dashboard, ApiDocs, AuditLogs, CostAnalysis, Sessions, Users, RiskMonitor, CommandPalette).
- Removed unused `errors` variable in ai-gateway edge function.

## [1.0.0] - 2026-09-03

### Added

- Dashboard with request activity charts, provider usage, latency distribution, and load balancing visualizations.
- Providers management with add/edit/delete, API key testing, priority ordering, and model configuration.
- Request logs with search, status filtering, and pagination.
- API playground for interactive testing with model selection, message builder, and response display.
- Browser Sessions management with session pool, rotation, quarantine, and health monitoring.
- Risk Monitor with provider scoring, smart routing info, and quarantine controls.
- User management with roles (admin/viewer), API key generation, and enable/disable.
- Audit logs with activity timeline.
- API documentation with code examples in cURL, Python, JavaScript, OpenAI SDK, and PHP.
- Settings with appearance (theme/language), gateway configuration, and alert configuration.
- Command palette (Ctrl+K) for quick navigation.
- Notifications bell with unread count.
- Full Persian (Farsi) and English bilingual support.
- Dark and light theme support.
- Supabase backend with RLS policies on all tables.
- Edge function for AI gateway proxy with OpenAI-compatible API format.
