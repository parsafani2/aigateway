-- Add account_name column to browser_sessions for multi-account support
ALTER TABLE browser_sessions ADD COLUMN IF NOT EXISTS account_name text;

-- Add index for faster lookups by account_name
CREATE INDEX IF NOT EXISTS idx_browser_sessions_account_name ON browser_sessions(account_name);

-- Add comment
COMMENT ON COLUMN browser_sessions.account_name IS 'Optional label for identifying which account this session belongs to (e.g. "ChatGPT Account #1")';
