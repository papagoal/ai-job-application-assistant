begin;

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'free',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  analysis_count integer not null default 0 check (analysis_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.usage_counters enable row level security;
alter table public.stripe_events enable row level security;

create policy "Users read their own subscription"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their own usage"
  on public.usage_counters for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.consume_billing_entitlement(
  p_user_id uuid,
  p_feature text
)
returns table (
  allowed boolean,
  plan text,
  used integer,
  usage_limit integer,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text := 'free';
  v_limit integer := 3;
  v_used integer := 0;
  v_period_start date := date_trunc('month', now())::date;
begin
  if exists (
    select 1
    from public.subscriptions
    where user_id = p_user_id
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  ) then
    v_plan := 'pro';
    v_limit := 50;
  end if;

  if p_feature in ('resume_regeneration', 'interview_prep') then
    return query select
      v_plan = 'pro',
      v_plan,
      0,
      null::integer,
      case when v_plan = 'pro' then null::text else 'pro_required' end;
    return;
  end if;

  if p_feature <> 'job_analysis' then
    return query select false, v_plan, 0, null::integer, 'unknown_feature'::text;
    return;
  end if;

  insert into public.usage_counters (user_id, period_start, analysis_count)
  values (p_user_id, v_period_start, 1)
  on conflict (user_id, period_start) do update
    set analysis_count = public.usage_counters.analysis_count + 1,
        updated_at = now()
    where public.usage_counters.analysis_count < v_limit
  returning analysis_count into v_used;

  if v_used is null then
    select analysis_count into v_used
    from public.usage_counters
    where user_id = p_user_id and period_start = v_period_start;

    return query select false, v_plan, v_used, v_limit, 'limit_reached'::text;
    return;
  end if;

  return query select true, v_plan, v_used, v_limit, null::text;
end;
$$;

revoke all on function public.consume_billing_entitlement(uuid, text) from public;
grant execute on function public.consume_billing_entitlement(uuid, text) to service_role;

commit;
