
-- Deny all INSERT and DELETE on transcripts (only manageable via service role / direct DB)
CREATE POLICY "No public insert on transcripts"
ON public.transcripts FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public delete on transcripts"
ON public.transcripts FOR DELETE
USING (false);
