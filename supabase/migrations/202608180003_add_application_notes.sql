alter table public.applications
  add column if not exists notes text not null default '';
