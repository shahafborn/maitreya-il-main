-- Add end date to support multi-day events (retreats, workshops, etc.)
ALTER TABLE public.promotions
  ADD COLUMN event_end_date DATE;
