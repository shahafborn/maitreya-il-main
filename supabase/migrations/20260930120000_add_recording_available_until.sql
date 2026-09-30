-- Course recordings can have an availability window.
-- available_until = the moment the recording stops being watchable on the course
-- page; after it, the page shows a short note in place of the player.
-- NULL = no limit, so every existing recording behaves exactly as before.
alter table public.course_recordings add column if not exists available_until timestamptz;
