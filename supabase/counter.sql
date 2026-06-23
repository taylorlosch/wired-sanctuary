-- Run this in the Supabase SQL editor if you already set up the blog tables.

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
