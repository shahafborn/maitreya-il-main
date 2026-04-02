-- Fix: Main Teaching recording was missing week_number and session_type
UPDATE public.course_recordings
SET week_number = 1, session_type = 'main'
WHERE id = '9e46f6b5-5547-48c3-b918-1c4f251f72bc';
