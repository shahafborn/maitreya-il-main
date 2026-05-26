-- Drop the access code on the Mahamudra course so the public auto-enrollment
-- flow works. The current CourseRegister UI (post-commit 4905188, Feb 22 2026)
-- no longer collects access codes from users - it auto-enrolls right after
-- auth, calling enroll_in_course() without an access code. Courses with a
-- non-NULL access_code therefore fail enrollment ("Invalid access code"),
-- which the frontend surfaces as "Enrollment failed".
--
-- For Mahamudra we want self-serve enrollment: the course URL is only emailed
-- to paid participants, and they create an account + auto-enroll on arrival.

UPDATE public.courses
SET access_code = NULL
WHERE slug = 'mahamudra-2026';
