/*
# Add Cost Tracking and Anomaly Detection Schema

1. Overview
- Adds cost tracking columns to `request_logs` for per-request cost analysis.
- Creates `cost_budgets` table for budget alert configuration.
- Creates `anomaly_events` table for anomaly detection events.
- Creates `getting_started_progress` table for educational content tracking.

2. New Columns on `request_logs`
- `cost` (numeric, default 0) — calculated cost per request based on tokens and provider pricing.
- `model_name` (text, nullable) — the specific model used, for cost breakdown by model.

3. New Tables
- `cost_budgets` — budget limits with alert thresholds (daily, weekly, monthly).
  - `id`, `name`, `period` (daily/weekly/monthly), `limit_amount`, `current_amount`, `alert_threshold` (percentage), `enabled`, `created_at`, `updated_at`
- `anomaly_events` — detected anomalies in gateway behavior.
  - `id`, `type` (latency_spike/error_spike/cost_spike/detection_signal/usage_pattern), `provider`, `severity` (low/medium/high/critical), `description`, `metric_value`, `expected_value`, `metadata` (jsonb), `resolved`, `resolved_at`, `created_at`
- `getting_started_progress` — tracks user progress through educational tutorials.
  - `id`, `tutorial_id`, `completed`, `completed_at`, `created_at`

4. Security
- Enable RLS on all new tables.
- Allow anon + authenticated CRUD (single-tenant app, no sign-in screen).

5. Important Notes
- The `cost` column on `request_logs` is nullable with default 0 so existing rows are unaffected.
- The `model_name` column helps with cost analysis by individual model.
*/

-- Add cost tracking columns to request_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'request_logs' AND column_name = 'cost') THEN
    ALTER TABLE request_logs ADD COLUMN cost numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'request_logs' AND column_name = 'model_name') THEN
    ALTER TABLE request_logs ADD COLUMN model_name text;
  END IF;
END $$;

-- Cost budgets table
CREATE TABLE IF NOT EXISTS cost_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly')),
  limit_amount numeric NOT NULL DEFAULT 100,
  current_amount numeric NOT NULL DEFAULT 0,
  alert_threshold integer NOT NULL DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cost_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cost_budgets" ON cost_budgets;
CREATE POLICY "anon_select_cost_budgets" ON cost_budgets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cost_budgets" ON cost_budgets;
CREATE POLICY "anon_insert_cost_budgets" ON cost_budgets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cost_budgets" ON cost_budgets;
CREATE POLICY "anon_update_cost_budgets" ON cost_budgets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cost_budgets" ON cost_budgets;
CREATE POLICY "anon_delete_cost_budgets" ON cost_budgets FOR DELETE
  TO anon, authenticated USING (true);

-- Anomaly events table
CREATE TABLE IF NOT EXISTS anomaly_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('latency_spike', 'error_spike', 'cost_spike', 'detection_signal', 'usage_pattern')),
  provider text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  metric_value numeric,
  expected_value numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_anomaly_events" ON anomaly_events;
CREATE POLICY "anon_select_anomaly_events" ON anomaly_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_anomaly_events" ON anomaly_events;
CREATE POLICY "anon_insert_anomaly_events" ON anomaly_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_anomaly_events" ON anomaly_events;
CREATE POLICY "anon_update_anomaly_events" ON anomaly_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_anomaly_events" ON anomaly_events;
CREATE POLICY "anon_delete_anomaly_events" ON anomaly_events FOR DELETE
  TO anon, authenticated USING (true);

-- Getting started progress table
CREATE TABLE IF NOT EXISTS getting_started_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE getting_started_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_progress" ON getting_started_progress;
CREATE POLICY "anon_select_progress" ON getting_started_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_progress" ON getting_started_progress;
CREATE POLICY "anon_insert_progress" ON getting_started_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_progress" ON getting_started_progress;
CREATE POLICY "anon_update_progress" ON getting_started_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_progress" ON getting_started_progress;
CREATE POLICY "anon_delete_progress" ON getting_started_progress FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default cost budget
INSERT INTO cost_budgets (name, period, limit_amount, alert_threshold, enabled)
SELECT 'Default Monthly Budget', 'monthly', 100, 80, true
WHERE NOT EXISTS (SELECT 1 FROM cost_budgets WHERE name = 'Default Monthly Budget');

-- Create index for anomaly queries
CREATE INDEX IF NOT EXISTS idx_anomaly_events_created_at ON anomaly_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_resolved ON anomaly_events (resolved);
CREATE INDEX IF NOT EXISTS idx_request_logs_cost ON request_logs (cost);
CREATE INDEX IF NOT EXISTS idx_request_logs_model_name ON request_logs (model_name);
