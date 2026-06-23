-- Run this in the Supabase SQL editor for project setup.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  meta_line text not null default '',
  image_url text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Public can read published posts"
on public.posts
for select
using (published = true);

create policy "Authenticated users can insert posts"
on public.posts
for insert
to authenticated
with check (true);

create policy "Authenticated users can update posts"
on public.posts
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete posts"
on public.posts
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "Public can view blog images"
on storage.objects
for select
using (bucket_id = 'blog-images');

create policy "Authenticated users can upload blog images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'blog-images');

create policy "Authenticated users can update blog images"
on storage.objects
for update
to authenticated
using (bucket_id = 'blog-images')
with check (bucket_id = 'blog-images');

create policy "Authenticated users can delete blog images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'blog-images');

-- Site visitor counter (classic hit counter)
create table if not exists public.site_counters (
  id text primary key,
  value bigint not null default 0
);

insert into public.site_counters (id, value)
values ('visitors', 7741)
on conflict (id) do nothing;

alter table public.site_counters enable row level security;

create policy "Public can read site counters"
on public.site_counters
for select
using (true);

create or replace function public.increment_visitor_count()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  update public.site_counters
  set value = value + 1
  where id = 'visitors'
  returning value into new_count;

  if new_count is null then
    insert into public.site_counters (id, value)
    values ('visitors', 1)
    on conflict (id) do update
    set value = public.site_counters.value + 1
    returning value into new_count;
  end if;

  return new_count;
end;
$$;

grant execute on function public.increment_visitor_count() to anon, authenticated;
