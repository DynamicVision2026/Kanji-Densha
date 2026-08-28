-- Engine swap: kanji_progress gains the columns CharacterProgress needs that
-- the old ProgressState never tracked. Dummy data (founder-confirmed) —
-- truncated below rather than migrated column-by-column, since the two
-- state shapes don't actually agree on what "in progress" meant.
--
-- Columns from 0002/0003/0005 not listed here (echo_success_count,
-- correct_streak, correct_streak_by_kind, seen_at, last_practice_at,
-- attempts, last_success_by_kind) are left in place, unused, rather than
-- dropped — the real engine has no source data for several of them
-- (see apps/web/src/lib/legacy-progress-adapter.ts), and a DROP COLUMN on
-- a table this migration can't verify against live data is a heavier
-- irreversible step than leaving dead columns for a later cleanup pass.

truncate table kanji_progress;
truncate table practice_events;

alter table kanji_progress add column if not exists almost_session_id text;
alter table kanji_progress add column if not exists lost_flag boolean not null default false;
alter table kanji_progress add column if not exists novel_failures text not null default '[]';
alter table kanji_progress add column if not exists open_echo text;
alter table kanji_progress add column if not exists echoes text not null default '[]';
