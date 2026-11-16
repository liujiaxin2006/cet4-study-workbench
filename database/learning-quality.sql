CREATE TABLE IF NOT EXISTS practice_submissions (
 id bigserial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 paper_id text NOT NULL, group_id text NOT NULL, kind text NOT NULL,
 revision integer NOT NULL, correct integer NOT NULL CHECK(correct>=0), total integer NOT NULL CHECK(total>=correct),
 uncertain integer NOT NULL CHECK(uncertain>=0), assisted boolean NOT NULL DEFAULT false,
 is_first boolean NOT NULL, submitted_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,paper_id,group_id,revision)
);
CREATE INDEX IF NOT EXISTS practice_submissions_date_idx ON practice_submissions(submitted_at,user_id);
CREATE TABLE IF NOT EXISTS study_feedback (
 id uuid PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 category text NOT NULL CHECK(category IN ('question','answer','audio','usability','account')),
 paper_id text, group_id text, question_number integer,
 message text NOT NULL CHECK(length(message) BETWEEN 5 AND 2000),
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','resolved')),
 admin_note text NOT NULL DEFAULT '', revision integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS study_feedback_status_idx ON study_feedback(status,created_at DESC);
CREATE INDEX IF NOT EXISTS study_feedback_user_idx ON study_feedback(user_id,created_at);
CREATE TABLE IF NOT EXISTS learning_quality_meta (id text PRIMARY KEY, started_at timestamptz NOT NULL DEFAULT now());
INSERT INTO learning_quality_meta(id) VALUES('v1') ON CONFLICT DO NOTHING;
