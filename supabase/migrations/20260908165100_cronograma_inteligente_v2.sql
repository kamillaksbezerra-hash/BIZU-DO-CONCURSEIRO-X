-- Bizu do Concurseiro X — Cronograma Inteligente v2
-- Escopo estrito: somente objetos bizu_*.

alter table public.bizu_study_calendar_events
  add column if not exists topic_id uuid references public.bizu_topics(id) on delete set null,
  add column if not exists plan_id uuid references public.bizu_study_plans(id) on delete set null,
  add column if not exists priority_score numeric not null default 0,
  add column if not exists priority_level text,
  add column if not exists reason text,
  add column if not exists resource_links jsonb not null default '[]'::jsonb,
  add column if not exists source text not null default 'manual',
  add column if not exists task_key text,
  add column if not exists completed_at timestamptz,
  add column if not exists skipped_at timestamptz,
  add column if not exists adaptation_version text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.bizu_study_plans
  add column if not exists planning_horizon_days integer,
  add column if not exists last_adapted_at timestamptz,
  add column if not exists adaptation_reason text,
  add column if not exists planner_version text;

create table if not exists public.bizu_study_plan_adaptations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.bizu_study_plans(id) on delete set null,
  competition_id uuid references public.bizu_competitions(id) on delete set null,
  course_id uuid references public.bizu_courses(id) on delete set null,
  trigger_reason text not null default 'manual',
  input_snapshot jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.bizu_study_plan_adaptations enable row level security;

drop policy if exists bizu_study_plan_adaptations_owner on public.bizu_study_plan_adaptations;
create policy bizu_study_plan_adaptations_owner
on public.bizu_study_plan_adaptations
for all to authenticated
using (((select auth.uid()) = user_id) or (select private.is_admin()))
with check (((select auth.uid()) = user_id) or (select private.is_admin()));

create index if not exists idx_bizu_study_calendar_user_date_status
  on public.bizu_study_calendar_events(user_id,event_date,status);
create index if not exists idx_bizu_study_calendar_comp_topic
  on public.bizu_study_calendar_events(competition_id,topic_id,event_date);
create index if not exists idx_bizu_study_calendar_plan
  on public.bizu_study_calendar_events(plan_id,event_date);
create index if not exists idx_bizu_study_calendar_task_key
  on public.bizu_study_calendar_events(user_id,task_key,event_date);
create index if not exists idx_bizu_adaptations_user_created
  on public.bizu_study_plan_adaptations(user_id,created_at desc);
create index if not exists idx_bizu_plans_user_active_version
  on public.bizu_study_plans(user_id,active,planner_version);
