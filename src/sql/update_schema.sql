-- Run this to update your existing table
ALTER TABLE public.mini_apps 
ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
