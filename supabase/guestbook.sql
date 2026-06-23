-- Run this in the Supabase SQL editor if you already set up the blog tables.

create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  website text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.guestbook_entries enable row level security;

create policy "Public can read guestbook entries"
on public.guestbook_entries
for select
using (true);

create policy "Public can sign guestbook"
on public.guestbook_entries
for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 1 and 40
  and char_length(trim(message)) between 1 and 500
  and char_length(location) <= 60
  and char_length(website) <= 200
);

insert into public.guestbook_entries (name, location, website, message, created_at)
values
  (
    'wanderer_of_kan',
    'the wired',
    '',
    'found this place at 3am. the layout feels like something i dreamed about in 1999. pirotess shrine when.',
    now() - interval '12 days'
  ),
  (
    'dark_elf_97',
    'marmo',
    '',
    'ashara if you are reading this: thank you for keeping old web alive. signed from a library computer.',
    now() - interval '5 days'
  ),
  (
    'lain_fan_04',
    'layer 07',
    '',
    'present day. present time. your guestbook is open and i am here. no need to shout.',
    now() - interval '1 day'
  );
