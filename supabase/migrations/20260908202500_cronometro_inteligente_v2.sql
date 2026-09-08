alter table public.bizu_study_sessions
  add column if not exists technique text,
  add column if not exists planned_minutes integer,
  add column if not exists planned_cycles integer not null default 1,
  add column if not exists completed_cycles integer not null default 0,
  add column if not exists short_break_minutes integer not null default 5,
  add column if not exists long_break_minutes integer not null default 15,
  add column if not exists study_seconds integer not null default 0,
  add column if not exists break_seconds integer not null default 0,
  add column if not exists pause_count integer not null default 0,
  add column if not exists interruption_count integer not null default 0,
  add column if not exists session_phase text not null default 'study',
  add column if not exists phase_started_at timestamptz,
  add column if not exists phase_duration_seconds integer,
  add column if not exists phase_paused_seconds integer not null default 0,
  add column if not exists schedule_event_id uuid,
  add column if not exists simulation_id uuid,
  add column if not exists essay_topic_id uuid,
  add column if not exists auto_start_next boolean not null default false,
  add column if not exists sound_enabled boolean not null default true,
  add column if not exists notifications_enabled boolean not null default false,
  add column if not exists focus_mode boolean not null default false,
  add column if not exists timer_version text,
  add column if not exists timer_metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.bizu_study_sessions add constraint bizu_study_sessions_schedule_event_id_fkey foreign key (schedule_event_id) references public.bizu_study_calendar_events(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.bizu_study_sessions add constraint bizu_study_sessions_simulation_id_fkey foreign key (simulation_id) references public.bizu_simulations(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.bizu_study_sessions add constraint bizu_study_sessions_essay_topic_id_fkey foreign key (essay_topic_id) references public.bizu_essay_topics(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.bizu_study_sessions add constraint bizu_study_sessions_planned_minutes_check check (planned_minutes is null or planned_minutes between 1 and 720);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.bizu_study_sessions add constraint bizu_study_sessions_planned_cycles_check check (planned_cycles between 1 and 20);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.bizu_study_sessions add constraint bizu_study_sessions_completed_cycles_check check (completed_cycles between 0 and 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.bizu_study_sessions add constraint bizu_study_sessions_timer_nonnegative_check check (study_seconds >= 0 and break_seconds >= 0 and pause_count >= 0 and interruption_count >= 0 and phase_paused_seconds >= 0);
exception when duplicate_object then null; end $$;

create index if not exists bizu_study_sessions_user_started_idx on public.bizu_study_sessions(user_id, started_at desc);
create index if not exists bizu_study_sessions_user_timer_status_idx on public.bizu_study_sessions(user_id, timer_status, ended_at);
create index if not exists bizu_study_sessions_schedule_event_idx on public.bizu_study_sessions(schedule_event_id) where schedule_event_id is not null;
create index if not exists bizu_study_sessions_technique_idx on public.bizu_study_sessions(user_id, technique, started_at desc) where technique is not null;

create or replace function private.bizu_log_cronograma_v2_completion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if new.source = 'cronograma_inteligente_v2'
     and new.status = 'completed'
     and old.status is distinct from 'completed'
     and new.topic_id is not null
     and coalesce(new.metadata->>'timer_session_id','') = '' then
    insert into public.bizu_study_sessions(
      user_id, competition_id, subject_id, topic_id, study_type,
      started_at, ended_at, duration_minutes, questions_count, timer_status,
      technique, planned_minutes, study_seconds, completed_cycles, planned_cycles,
      timer_version, timer_metadata, updated_at
    ) values (
      new.user_id,
      new.competition_id,
      new.subject_id,
      new.topic_id,
      'cronograma_v2_' || coalesce(new.study_type,'estudo'),
      coalesce(new.completed_at, now()) - make_interval(mins => greatest(10, least(720, new.duration_minutes))),
      coalesce(new.completed_at, now()),
      greatest(10, least(720, new.duration_minutes)),
      0,
      'cronograma',
      greatest(10, least(720, new.duration_minutes)),
      greatest(10, least(720, new.duration_minutes)) * 60,
      1,
      1,
      'cronometro_inteligente_v2',
      jsonb_build_object('origin','cronograma_completion_trigger','schedule_event_id',new.id),
      now()
    );
  end if;
  return new;
end;
$$;

revoke execute on function private.bizu_log_cronograma_v2_completion() from public, anon, authenticated;
