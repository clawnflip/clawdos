-- Add processing_claims table to prevent multi-tab duplicate responses

-- Create processing claims table
CREATE TABLE IF NOT EXISTS public.processing_claims (
    message_id BIGINT PRIMARY KEY,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_by TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.processing_claims ENABLE ROW LEVEL SECURITY;

-- Allow anyone to claim (insert)
DROP POLICY IF EXISTS "Anyone can claim messages" ON public.processing_claims;
CREATE POLICY "Anyone can claim messages" 
    ON public.processing_claims 
    FOR INSERT 
    WITH CHECK (true);

-- Allow anyone to read claims
DROP POLICY IF EXISTS "Anyone can read claims" ON public.processing_claims;
CREATE POLICY "Anyone can read claims" 
    ON public.processing_claims 
    FOR SELECT 
    USING (true);

-- Auto-cleanup old claims (> 30 seconds, in case of crashes)
CREATE OR REPLACE FUNCTION cleanup_old_claims() RETURNS void AS $$
BEGIN
    DELETE FROM public.processing_claims 
    WHERE claimed_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Note: In production, run this periodically via cron or trigger
-- For now, we'll call it manually in the app or rely on short-lived claims
