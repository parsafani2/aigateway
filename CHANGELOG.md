# Changelog

All notable changes to the AI Gateway project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Cost Analysis page** — track spending per request, view cost trends by day, break down costs by provider and model, configure budget alerts with thresholds, and export cost data as CSV.
- **Enhanced Monitoring page** — real-time provider health status with health scores, response time tracking chart, and anomaly detection with filterable event log and resolve/unresolve actions.
- **Getting Started guide** — interactive tutorials with progress tracking, prerequisites checklist, code examples in cURL/Python/JavaScript, and FAQ section.
- **Anomaly detection system** — database table for tracking latency spikes, error spikes, cost spikes, detection signals, and usage pattern anomalies with severity levels.
- **Cost budgets** — database table for configurable spending budgets (daily/weekly/monthly) with alert thresholds.
- **Tutorial progress tracking** — database table for storing user completion state across educational tutorials.
- New navigation items: Cost Analysis, Monitoring, Getting Started.
- New translation keys (English and Persian) for all new features.
- Command palette support for all new pages.

### Changed

- Consolidated lucide-react imports in App.tsx into a single import statement.
- Updated RequestLog type to include optional `cost` and `model_name` fields.
- Updated Page type to include `costAnalysis`, `monitoring`, and `gettingStarted` routes.

### Fixed

- Removed duplicate `critical` key in English translations.

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
