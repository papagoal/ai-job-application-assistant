create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  professional_summary text not null default '',
  resume_text text not null,
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  match_score integer not null check (match_score between 0 and 100),
  status text not null default 'Draft' check (status in ('Draft', 'Applied', 'Interview')),
  analysis jsonb not null,
  job_description text not null,
  resume_text text not null,
  created_at timestamptz not null default now()
);

create index applications_user_id_created_at_idx
  on public.applications (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.applications enable row level security;

create policy "Users manage their own profile"
  on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own applications"
  on public.applications for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
