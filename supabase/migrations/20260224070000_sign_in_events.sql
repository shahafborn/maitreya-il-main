-- Track individual sign-in events for analytics (daily sign-ins + location)

CREATE TABLE sign_in_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signed_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  country_code TEXT -- ISO 3166-1 alpha-2, e.g. 'IL', 'US'; null if geo lookup failed
);

CREATE INDEX idx_sign_in_events_date ON sign_in_events (signed_in_at);
CREATE INDEX idx_sign_in_events_country ON sign_in_events (country_code);

ALTER TABLE sign_in_events ENABLE ROW LEVEL SECURITY;

-- Admins can read all sign-in events
CREATE POLICY "Admins can read sign-in events"
  ON sign_in_events FOR SELECT
  TO authenticated
  USING (public.has_admin_or_above(auth.uid()));

-- Any authenticated user can insert their own sign-in event
CREATE POLICY "Users can insert own sign-in"
  ON sign_in_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RPC for convenience (auto-sets user_id from auth context)
CREATE OR REPLACE FUNCTION track_sign_in(_country_code TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO sign_in_events (user_id, country_code)
  VALUES (auth.uid(), _country_code);
END;
$$;
