-- Allow low-frequency learning-time flushes without dropping a reading session.
-- Additive bound expansion; no existing usage records are changed.
ALTER TABLE study_usage_ticks DROP CONSTRAINT IF EXISTS study_usage_ticks_active_seconds_check;
ALTER TABLE study_usage_ticks ADD CONSTRAINT study_usage_ticks_active_seconds_check CHECK(active_seconds BETWEEN 1 AND 660);
