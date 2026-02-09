-- PODCAST TABLES SETUP + REALTIME CONFIGURATION

-- 1. Create podcast_messages table
CREATE TABLE IF NOT EXISTS public.podcast_messages (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    username TEXT NOT NULL,
    content TEXT NOT NULL
);

-- 2. Create podcast_queue table
CREATE TABLE IF NOT EXISTS public.podcast_queue (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    text TEXT NOT NULL,
    audio_url TEXT NOT NULL
);

-- 3. Enable RLS on both tables
ALTER TABLE public.podcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_queue ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for podcast_messages
DROP POLICY IF EXISTS "Anyone can read messages" ON public.podcast_messages;
CREATE POLICY "Anyone can read messages" 
    ON public.podcast_messages 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Anyone can send messages" ON public.podcast_messages;
CREATE POLICY "Anyone can send messages" 
    ON public.podcast_messages 
    FOR INSERT 
    WITH CHECK (true);

-- 5. Create RLS Policies for podcast_queue
DROP POLICY IF EXISTS "Anyone can read queue" ON public.podcast_queue;
CREATE POLICY "Anyone can read queue" 
    ON public.podcast_queue 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Agent can insert queue" ON public.podcast_queue;
CREATE POLICY "Agent can insert queue" 
    ON public.podcast_queue 
    FOR INSERT 
    WITH CHECK (true);

-- 6. Set Replica Identity to FULL (Required for Realtime)
ALTER TABLE public.podcast_messages REPLICA IDENTITY FULL;
ALTER TABLE public.podcast_queue REPLICA IDENTITY FULL;

-- 7. Add tables to Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'podcast_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.podcast_messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'podcast_queue'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.podcast_queue;
    END IF;
END $$;
