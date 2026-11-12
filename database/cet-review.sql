-- Admin-only corpus staging. No user records or source materials are included.
CREATE TABLE IF NOT EXISTS cet_corpus_imports (
 id text PRIMARY KEY, inventory jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cet_review_papers (
 id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cet_review_attempts (
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 paper_id text NOT NULL REFERENCES cet_review_papers(id),
 revision integer NOT NULL DEFAULT 1,
 answers jsonb NOT NULL DEFAULT '{}'::jsonb,
 texts jsonb NOT NULL DEFAULT '{}'::jsonb,
 submitted_groups jsonb NOT NULL DEFAULT '[]'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,paper_id)
);
