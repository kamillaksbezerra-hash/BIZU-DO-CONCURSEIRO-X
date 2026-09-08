-- Bizu do Concurseiro X — Cronograma Inteligente v2
-- Registra automaticamente no histórico de estudo a conclusão das tarefas do cronograma.
-- Escopo estrito: objetos bizu_*; não altera recursos da Residência 2027.

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
     and new.topic_id is not null then
    insert into public.bizu_study_sessions(
      user_id, competition_id, subject_id, topic_id, study_type,
      started_at, ended_at, duration_minutes, questions_count, timer_status
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
      'completed'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bizu_log_cronograma_v2_completion on public.bizu_study_calendar_events;
create trigger trg_bizu_log_cronograma_v2_completion
after update of status on public.bizu_study_calendar_events
for each row
execute function private.bizu_log_cronograma_v2_completion();
