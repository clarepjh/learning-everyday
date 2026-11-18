begin;

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint subjects_user_name_unique unique (user_id, name),
  constraint subjects_user_id_unique unique (user_id, id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null,
  title text not null,
  topic text not null default '',
  content_md text not null default '',
  mistakes_md text,
  learned_on date not null default current_date,
  needs_revision boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint notes_topic_length check (char_length(topic) <= 200),
  constraint notes_content_length check (char_length(content_md) <= 1000000),
  constraint notes_mistakes_length check (mistakes_md is null or char_length(mistakes_md) <= 1000000),
  constraint notes_user_id_unique unique (user_id, id),
  constraint notes_subject_owner_fkey
    foreign key (user_id, subject_id)
    references public.subjects (user_id, id)
);

create table public.study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  summary_md text not null,
  note_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_logs_summary_length
    check (char_length(btrim(summary_md)) between 1 and 50000),
  constraint study_logs_note_owner_fkey
    foreign key (user_id, note_id)
    references public.notes (user_id, id)
);

create index notes_owner_learned_on_idx
  on public.notes (user_id, learned_on desc);
create index notes_owner_subject_revision_idx
  on public.notes (user_id, subject_id, needs_revision);
create index study_logs_owner_entry_date_idx
  on public.study_logs (user_id, entry_date desc);
create index study_logs_owner_note_idx
  on public.study_logs (user_id, note_id)
  where note_id is not null;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();
create trigger study_logs_set_updated_at
  before update on public.study_logs
  for each row execute function public.set_updated_at();

create function public.detach_study_logs_before_note_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.study_logs
     set note_id = null
   where user_id = old.user_id
     and note_id = old.id;
  return old;
end;
$$;

create trigger notes_detach_study_logs
  before delete on public.notes
  for each row execute function public.detach_study_logs_before_note_delete();

alter table public.subjects enable row level security;
alter table public.notes enable row level security;
alter table public.study_logs enable row level security;

create policy subjects_owner_select on public.subjects
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy subjects_owner_insert on public.subjects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy subjects_owner_update on public.subjects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy subjects_owner_delete on public.subjects
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy notes_owner_select on public.notes
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notes_owner_insert on public.notes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy notes_owner_update on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy notes_owner_delete on public.notes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy study_logs_owner_select on public.study_logs
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy study_logs_owner_insert on public.study_logs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy study_logs_owner_update on public.study_logs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy study_logs_owner_delete on public.study_logs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.subjects, public.notes, public.study_logs from public, anon;
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on table public.subjects, public.notes, public.study_logs to authenticated;
grant all on table public.subjects, public.notes, public.study_logs to service_role;

commit;
