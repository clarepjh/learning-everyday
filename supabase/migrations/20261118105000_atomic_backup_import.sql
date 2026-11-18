begin;

create function public.import_learning_backup(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  item record;
  inserted_count integer;
  subjects_inserted integer := 0;
  subjects_skipped integer := 0;
  notes_inserted integer := 0;
  notes_skipped integer := 0;
  logs_inserted integer := 0;
  logs_skipped integer := 0;
begin
  if owner_id is null then
    raise exception 'Sign in is required to import a backup.';
  end if;

  if jsonb_typeof(payload) is distinct from 'object'
     or payload->>'schemaVersion' is distinct from '1'
     or jsonb_typeof(payload->'subjects') is distinct from 'array'
     or jsonb_typeof(payload->'notes') is distinct from 'array'
     or jsonb_typeof(payload->'studyLogs') is distinct from 'array'
     or pg_catalog.octet_length(payload::text) > 10485760
     or pg_catalog.jsonb_array_length(payload->'subjects') > 10000
     or pg_catalog.jsonb_array_length(payload->'notes') > 10000
     or pg_catalog.jsonb_array_length(payload->'studyLogs') > 10000 then
    raise exception 'Backup schema or record counts are invalid.';
  end if;

  if exists (
    select 1
      from pg_catalog.jsonb_array_elements(payload->'subjects') as entries(item)
     where jsonb_typeof(entries.item) is distinct from 'object'
        or entries.item ? 'user_id'
  ) or exists (
    select 1
      from pg_catalog.jsonb_array_elements(payload->'notes') as entries(item)
     where jsonb_typeof(entries.item) is distinct from 'object'
        or entries.item ? 'user_id'
  ) or exists (
    select 1
      from pg_catalog.jsonb_array_elements(payload->'studyLogs') as entries(item)
     where jsonb_typeof(entries.item) is distinct from 'object'
        or entries.item ? 'user_id'
  ) then
    raise exception 'Backup rows must be objects and cannot specify an owner.';
  end if;

  if exists (
    select r.id
      from pg_catalog.jsonb_to_recordset(payload->'subjects') as r(id uuid)
     group by r.id
    having count(*) > 1
  ) or exists (
    select r.id
      from pg_catalog.jsonb_to_recordset(payload->'notes') as r(id uuid)
     group by r.id
    having count(*) > 1
  ) or exists (
    select r.id
      from pg_catalog.jsonb_to_recordset(payload->'studyLogs') as r(id uuid)
     group by r.id
    having count(*) > 1
  ) then
    raise exception 'Backup contains duplicate record IDs.';
  end if;

  for item in
    select *
      from pg_catalog.jsonb_to_recordset(payload->'subjects')
        as r(id uuid, name text, created_at timestamptz, updated_at timestamptz)
  loop
    if exists (
      select 1 from public.subjects
       where id = item.id and user_id = owner_id
    ) then
      subjects_skipped := subjects_skipped + 1;
    else
      insert into public.subjects (id, user_id, name, created_at, updated_at)
      values (item.id, owner_id, item.name, item.created_at, item.updated_at);
      subjects_inserted := subjects_inserted + 1;
    end if;
  end loop;

  for item in
    select *
      from pg_catalog.jsonb_to_recordset(payload->'notes')
        as r(
          id uuid,
          subject_id uuid,
          title text,
          topic text,
          content_md text,
          mistakes_md text,
          learned_on date,
          needs_revision boolean,
          tags text[],
          created_at timestamptz,
          updated_at timestamptz
        )
  loop
    if exists (
      select 1 from public.notes
       where id = item.id and user_id = owner_id
    ) then
      notes_skipped := notes_skipped + 1;
    else
      insert into public.notes (
        id, user_id, subject_id, title, topic, content_md, mistakes_md,
        learned_on, needs_revision, tags, created_at, updated_at
      )
      values (
        item.id, owner_id, item.subject_id, item.title, item.topic,
        item.content_md, item.mistakes_md, item.learned_on,
        item.needs_revision, coalesce(item.tags, '{}'),
        item.created_at, item.updated_at
      );
      notes_inserted := notes_inserted + 1;
    end if;
  end loop;

  for item in
    select *
      from pg_catalog.jsonb_to_recordset(payload->'studyLogs')
        as r(
          id uuid,
          entry_date date,
          summary_md text,
          note_id uuid,
          created_at timestamptz,
          updated_at timestamptz
        )
  loop
    if exists (
      select 1 from public.study_logs
       where id = item.id and user_id = owner_id
    ) then
      logs_skipped := logs_skipped + 1;
    else
      insert into public.study_logs (
        id, user_id, entry_date, summary_md, note_id, created_at, updated_at
      )
      values (
        item.id, owner_id, item.entry_date, item.summary_md, item.note_id,
        item.created_at, item.updated_at
      );
      logs_inserted := logs_inserted + 1;
    end if;
  end loop;

  return pg_catalog.jsonb_build_object(
    'subjectsInserted', subjects_inserted,
    'subjectsSkipped', subjects_skipped,
    'notesInserted', notes_inserted,
    'notesSkipped', notes_skipped,
    'studyLogsInserted', logs_inserted,
    'studyLogsSkipped', logs_skipped
  );
end;
$$;

revoke all on function public.import_learning_backup(jsonb) from public, anon;
grant execute on function public.import_learning_backup(jsonb) to authenticated;

commit;
