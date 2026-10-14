-- Run after provisioning email/password auth in a NEW Floot project.
-- No user rows, password hashes, session tokens or learning records are included.
CREATE TABLE IF NOT EXISTS study_progress (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{"version":1,"minutes":0,"daily":{},"words":{},"mistakes":[]}'::jsonb,
  revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Run only after confirming there are no users with the same email ignoring case/whitespace.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique ON users ((lower(btrim(email))));
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at);

