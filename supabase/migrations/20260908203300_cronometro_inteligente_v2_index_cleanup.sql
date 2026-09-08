drop index if exists public.bizu_study_sessions_user_started_idx;
create index if not exists bizu_study_sessions_simulation_idx on public.bizu_study_sessions(simulation_id) where simulation_id is not null;
create index if not exists bizu_study_sessions_essay_topic_idx on public.bizu_study_sessions(essay_topic_id) where essay_topic_id is not null;
