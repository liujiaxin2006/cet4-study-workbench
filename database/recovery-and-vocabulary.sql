DO $$ BEGIN CREATE TYPE recovery_request_status AS ENUM ('pending','issued','completed','declined'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS password_recovery_requests (
 id uuid PRIMARY KEY,email text NOT NULL,user_id integer REFERENCES users(id) ON DELETE SET NULL,
 status recovery_request_status NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now(),
 handled_by integer REFERENCES users(id) ON DELETE SET NULL,handled_at timestamptz
);
CREATE INDEX IF NOT EXISTS recovery_pending_idx ON password_recovery_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS recovery_email_idx ON password_recovery_requests(email,created_at DESC);
CREATE TABLE IF NOT EXISTS password_recovery_tokens (
 token_hash text PRIMARY KEY,user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 request_id uuid NOT NULL REFERENCES password_recovery_requests(id),created_by integer NOT NULL REFERENCES users(id),
 expires_at timestamptz NOT NULL,used_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recovery_token_user_idx ON password_recovery_tokens(user_id);
CREATE TABLE IF NOT EXISTS auth_action_limits (
 bucket text NOT NULL,window_start timestamptz NOT NULL,attempts integer NOT NULL DEFAULT 1,
 PRIMARY KEY(bucket,window_start)
);
