-- Refine the Healing Retreat schedule block with the actual session times
-- from the in-person (Hebrew) landing page. The online retreat is a direct
-- broadcast of the in-person retreat, so it follows the same daily schedule:
--   Days 2-5: 09:30-12:30 morning + 14:30-18:15 afternoon
--   Day 1: 14:00-18:15 (opening; retreat starts 14:00 IDT)
--   Day 6: 09:30-12:30 morning + 14:30-15:00 closing (retreat ends 15:00 IDT)

UPDATE public.course_content_blocks
SET body =
'All sessions take place on Zoom. All times are Israel time (IDT).

Day 1 - Monday, June 1, 2026 (White Tara)
14:00-18:15  Opening, teaching, and initiation

Day 2 - Tuesday, June 2, 2026 (White Tara)
09:30-12:30  Morning session
14:30-18:15  Afternoon session

Day 3 - Wednesday, June 3, 2026 (Medicine Buddha)
09:30-12:30  Morning session
14:30-18:15  Afternoon session

Day 4 - Thursday, June 4, 2026 (Medicine Buddha)
09:30-12:30  Morning session
14:30-18:15  Afternoon session

Day 5 - Friday, June 5, 2026 (White Chakrasamvara)
09:30-12:30  Morning session
14:30-18:15  Afternoon session

Day 6 - Saturday, June 6, 2026 (White Chakrasamvara)
09:30-12:30  Morning session
14:30-15:00  Closing

Each day includes teaching, initiation, guided practice, yoga, and meditation.

Daily start time by timezone (Days 2-6)
09:30 Israel (IDT)  |  07:30 London (BST)  |  02:30 New York (EDT)  |  16:30 Sydney (AEST)

Zoom
The same Zoom room is used for all six days.
Join Zoom: https://us06web.zoom.us/j/89503700954?pwd=ytGsWX3XopKwVczSUlkf4Lg6qaR1TB.1
Meeting ID: 895 0370 0954
Passcode: 502593'
WHERE section = 'schedule'
  AND course_id = (SELECT id FROM public.courses WHERE slug = 'healing-2026');
