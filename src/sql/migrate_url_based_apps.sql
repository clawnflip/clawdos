-- Migration: Add URL-based mini app support
-- Run this after setup_miniapps.sql

-- Add new columns for URL-based apps
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS app_url TEXT;
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS manifest_url TEXT;
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other' CHECK (category IN ('game', 'defi', 'social', 'utility', 'media', 'other'));
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS developer_name TEXT;
ALTER TABLE public.mini_apps ADD COLUMN IF NOT EXISTS app_type TEXT DEFAULT 'code' CHECK (app_type IN ('code', 'url'));

-- Make code column nullable (URL-based apps don't need code)
ALTER TABLE public.mini_apps ALTER COLUMN code DROP NOT NULL;

-- Fix RLS policy: 'approved' -> 'published'
DROP POLICY IF EXISTS "Allow public read access to approved apps" ON public.mini_apps;
CREATE POLICY "Allow public read access to published apps"
ON public.mini_apps
FOR SELECT
TO public
USING (status = 'published');

-- Keep the anon insert policy (already correct)
-- DROP POLICY IF EXISTS "Allow anon insert" ON public.mini_apps;
-- CREATE POLICY "Allow anon insert" ON public.mini_apps FOR INSERT TO public WITH CHECK (true);
