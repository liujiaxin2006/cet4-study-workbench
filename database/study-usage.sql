-- Additive migration; no existing user or progress data is changed.
CREATE TABLE IF NOT EXISTS study_usage_meta (
 id text PRIMARY KEY, started_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO study_usage_meta(id) VALUES ('v1') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS study_usage_sessions (
 id uuid PRIMARY KEY,
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 module text NOT NULL CHECK (module IN ('today','words','reading','listening','writing','coverage','review','more')),
 started_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 sequence integer NOT NULL DEFAULT 0,
 reported_seconds integer NOT NULL DEFAULT 0,
 active_seconds integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS study_usage_sessions_user_time ON study_usage_sessions(user_id,started_at DESC);
CREATE INDEX IF NOT EXISTS study_usage_sessions_time ON study_usage_sessions(started_at);
CREATE TABLE IF NOT EXISTS study_usage_clocks (
 user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 credited_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS study_usage_ticks (
 session_id uuid NOT NULL REFERENCES study_usage_sessions(id) ON DELETE CASCADE,
 sequence integer NOT NULL,
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 module text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 active_seconds integer NOT NULL CHECK(active_seconds BETWEEN 1 AND 660),
 PRIMARY KEY(session_id,sequence)
);
CREATE INDEX IF NOT EXISTS study_usage_ticks_time ON study_usage_ticks(occurred_at);
CREATE INDEX IF NOT EXISTS study_usage_ticks_user_time ON study_usage_ticks(user_id,occurred_at);
