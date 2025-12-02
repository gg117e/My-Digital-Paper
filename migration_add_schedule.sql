-- Add schedule column to entries table
alter table public.entries 
add column if not exists schedule jsonb default '[]'::jsonb;
