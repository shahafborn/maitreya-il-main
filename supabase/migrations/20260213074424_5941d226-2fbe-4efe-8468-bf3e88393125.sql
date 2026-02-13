
-- Add video metadata to transcripts table
ALTER TABLE public.transcripts 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS youtube_id TEXT NOT NULL DEFAULT '';

-- Populate with current hardcoded data
UPDATE public.transcripts SET title = 'מבוא לריפוי דרך מדיטציה, מנטרה וצבע', youtube_id = '_yRuzXTL5p4' WHERE part_number = 1;
UPDATE public.transcripts SET title = 'ריפוי דרך מדיטציה, מנטרה וצבע – חלק 2', youtube_id = 'yxHQECOp-IU' WHERE part_number = 2;
UPDATE public.transcripts SET title = 'ריפוי דרך מדיטציה, מנטרה וצבע – חלק 3', youtube_id = 'e9tZn0rssHc' WHERE part_number = 3;
UPDATE public.transcripts SET title = 'ריפוי דרך מדיטציה, מנטרה וצבע – חלק 4', youtube_id = 'RDUQ5XP_bU8' WHERE part_number = 4;
UPDATE public.transcripts SET title = 'ריפוי דרך מדיטציה, מנטרה וצבע – חלק 5', youtube_id = 'o3uB14XMSGs' WHERE part_number = 5;
UPDATE public.transcripts SET title = 'ריפוי דרך מדיטציה, מנטרה וצבע – חלק 6', youtube_id = 'b7aW1fy4bZ0' WHERE part_number = 6;

-- Create site_content table for editable page content
CREATE TABLE public.site_content (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
ON public.site_content FOR SELECT
USING (true);

CREATE POLICY "Admins can update site content"
ON public.site_content FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_transcripts_updated_at();

-- Seed initial content
INSERT INTO public.site_content (key, value) VALUES
  ('hero_title', 'הדרך לריפוי והילינג בודהיסטי'),
  ('hero_subtitle', 'לאמה גלן מולין חושף את סודות הריפוי הטנטרי הבודהיסטי
ב-6 סרטונים שיפתחו לכם את הדלת לעולם חדש של ריפוי ושלום פנימי'),
  ('cta_text', 'הרשמה לריטריט הריפוי'),
  ('final_cta_title', 'מוכנים לחוויה המלאה?'),
  ('final_cta_subtitle', 'ריטריט ריפוי בודהיסטי עם לאמה גלן מולין ודרופון צ''ונגול-לה'),
  ('final_cta_date', '26 למאי – 09 ליוני 2026'),
  ('final_cta_button', 'להרשמה לריטריט'),
  ('purchase_url', 'https://maitreya.org.il/he/our_events/lg26-the-path-of-buddhist-healing-retreat-he-1/#tickets');
