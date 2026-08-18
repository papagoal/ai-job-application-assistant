alter table public.profiles
  add column if not exists phone text not null default '',
  add column if not exists location text not null default '';
