-- Add missing columns to mini_apps table for the new agent deploy flow
-- Run this in your Supabase SQL Editor

-- app_url: for URL-based mini apps (agents deploy to hosting, submit URL)
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS app_url text NULL;

-- app_type: 'url' (hosted externally) or 'code' (raw HTML/JS)
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS app_type text NOT NULL DEFAULT 'code';

-- category: game, defi, social, utility, media, other
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS category text NULL DEFAULT 'other';

-- tags: array of string tags
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS tags text[] NULL;

-- developer_name: who built it
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS developer_name text NULL;

-- image_url: preview screenshot
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS image_url text NULL;

-- Make 'code' column nullable (URL-based apps don't have code)
ALTER TABLE public.mini_apps ALTER COLUMN code DROP NOT NULL;

-- Update default status from 'pending' to 'pending_review' for clarity
ALTER TABLE public.mini_apps ALTER COLUMN status SET DEFAULT 'pending_review';
