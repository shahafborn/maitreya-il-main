-- Correct day 3 end time on the Mahamudra schedule block (16:00 -> 18:00).
-- The original draft had 16:00 for Saturday's closing session, but the
-- actual schedule confirmed by Shahaf is 18:00.

UPDATE public.course_content_blocks
SET body =
'All sessions take place on Zoom. All times are Israel time (IDT).

Day 1 - Thursday, May 28, 2026
09:30-12:00  Morning session
12:00-14:00  Lunch break
14:00-18:00  Afternoon session

Day 2 - Friday, May 29, 2026
09:30-12:00  Morning session
12:00-14:00  Lunch break
14:00-18:00  Afternoon session

Day 3 - Saturday, May 30, 2026
09:30-12:00  Morning session
12:00-14:00  Lunch break
14:00-18:00  Closing session

The White Manjushri empowerment will take place during the retreat.

Daily start time by timezone
09:30 Israel (IDT)  |  07:30 London (BST)  |  02:30 New York (EDT)  |  16:30 Sydney (AEST)

Zoom
The same Zoom room is used for all three days.
Join Zoom: https://us06web.zoom.us/j/85618257711?pwd=P9nflXHlNWh5yojaIwvFr1ab8FfnBA.1
Meeting ID: 856 1825 7711
Passcode: 076095'
WHERE section = 'schedule'
  AND course_id = (SELECT id FROM public.courses WHERE slug = 'mahamudra-2026');
