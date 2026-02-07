-- Create mini_apps table
create table public.mini_apps (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  icon text null,
  description text null,
  code text not null,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'rejected')),
  version int not null default 1,
  owner_wallet text null,
  twitter_handle TEXT null, -- Updated to match code
  constraint mini_apps_pkey primary key (id)
);

-- Enable RLS
alter table public.mini_apps enable row level security;

-- Allow public read access to approved apps
create policy "Allow public read access to approved apps"
on public.mini_apps
for select
to public
using (status = 'approved');

-- Allow anon to insert (for submission)
create policy "Allow anon insert"
on public.mini_apps
for insert
to public
with check (true);
