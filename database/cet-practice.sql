CREATE TABLE IF NOT EXISTS cet_practice_attempts (
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 paper_id text NOT NULL REFERENCES cet_review_papers(id),
 group_id text NOT NULL,
 revision integer NOT NULL DEFAULT 0,
 state jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,paper_id,group_id)
);
CREATE TABLE IF NOT EXISTS cet_practice_reviews (
 user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 paper_id text NOT NULL REFERENCES cet_review_papers(id),
 group_id text NOT NULL,
 stage integer NOT NULL DEFAULT 0 CHECK(stage BETWEEN 0 AND 3),
 due_at timestamptz NOT NULL DEFAULT now(),
 last_reviewed_date text,
 wrong_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
 reason text NOT NULL DEFAULT 'wrong' CHECK(reason IN ('wrong','uncertain')),
 PRIMARY KEY(user_id,paper_id,group_id)
);
CREATE INDEX IF NOT EXISTS cet_practice_reviews_due ON cet_practice_reviews(user_id,due_at) WHERE stage<3;
