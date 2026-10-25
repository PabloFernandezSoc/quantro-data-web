-- ─────────────────────────────────────────────────────────────
-- Quantro Studio: app interna de producción de grillas (/app)
-- Aplicado vía MCP de Supabase. Este archivo es la fuente de verdad del esquema.
--
-- Roles:
--   profiles.is_admin = true  → Pablo: ve y edita todo, administra usuarios.
--   client_members.role:
--     'editor'  → Vale: edita piezas del cliente y confirma material.
--     'talent'  → JT / Jimmy: ve las grillas del cliente, marca sus partes como subidas.
--     'client'  → contacto del cliente: ve las grillas, sube material y comenta.
-- Los usuarios se crean desde la app (api/admin-users.js con service role).
-- ─────────────────────────────────────────────────────────────

-- ── Tablas ───────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  email      text not null,
  is_admin   boolean not null default false,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text not null unique,
  color                text not null default '#6366F1',
  drive_folder_url     text,
  edit_buffer_days     int  not null default 3 check (edit_buffer_days >= 0),
  schedule_buffer_days int  not null default 1 check (schedule_buffer_days >= 0),
  created_at           timestamptz not null default now()
);

create table if not exists public.client_members (
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null check (role in ('editor', 'talent', 'client')),
  primary key (client_id, user_id)
);
create index if not exists client_members_user_idx on public.client_members (user_id);

create table if not exists public.grids (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  month      date not null check (extract(day from month) = 1),
  status     text not null default 'borrador' check (status in ('borrador', 'en_revision', 'aprobada')),
  notes      text,
  created_at timestamptz not null default now(),
  unique (client_id, month)
);

create table if not exists public.pieces (
  id               uuid primary key default gen_random_uuid(),
  grid_id          uuid not null references public.grids (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  number           int,
  title            text not null,
  format           text not null default 'reel' check (format in ('reel', 'carrusel', 'historia', 'post')),
  pillar           text,
  hook             text,
  script           text,
  caption          text,
  publish_date     date,
  status           text not null default 'idea' check (status in (
                     'idea', 'aprobada', 'en_grabacion', 'material_por_revisar', 'material_completo',
                     'en_edicion', 'editada', 'programada', 'publicada', 'descartada')),
  drive_raw_url    text,
  drive_edited_url text,
  campaign_target  text not null default 'organico' check (campaign_target in ('organico', 'visitas_perfil', 'whatsapp', 'web')),
  published_url    text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists pieces_grid_idx on public.pieces (grid_id);
create index if not exists pieces_client_idx on public.pieces (client_id);

create table if not exists public.piece_parts (
  id          uuid primary key default gen_random_uuid(),
  piece_id    uuid not null references public.pieces (id) on delete cascade,
  assignee_id uuid references public.profiles (id) on delete set null,
  description text not null,
  status      text not null default 'pendiente' check (status in ('pendiente', 'subido', 'rechazado')),
  drive_url   text,
  note        text,
  uploaded_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists piece_parts_piece_idx on public.piece_parts (piece_id);
create index if not exists piece_parts_assignee_idx on public.piece_parts (assignee_id);

create table if not exists public.piece_events (
  id          bigint generated always as identity primary key,
  piece_id    uuid not null references public.pieces (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  type        text not null,
  from_status text,
  to_status   text,
  detail      text,
  created_at  timestamptz not null default now()
);
create index if not exists piece_events_piece_idx on public.piece_events (piece_id);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  piece_id   uuid not null references public.pieces (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_piece_idx on public.comments (piece_id);

-- Carpeta/link que cubre varias piezas (ej. "todo lo del mes en esta carpeta")
create table if not exists public.grid_uploads (
  id          uuid primary key default gen_random_uuid(),
  grid_id     uuid not null references public.grids (id) on delete cascade,
  uploader_id uuid references public.profiles (id) on delete set null,
  drive_url   text not null,
  note        text,
  piece_ids   uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists grid_uploads_grid_idx on public.grid_uploads (grid_id);

create table if not exists public.reminder_log (
  id            bigint generated always as identity primary key,
  user_id       uuid references public.profiles (id) on delete cascade,
  piece_part_id uuid references public.piece_parts (id) on delete cascade,
  kind          text not null,
  sent_on       date not null default (now() at time zone 'America/Santiago')::date,
  unique (piece_part_id, kind, sent_on)
);

-- ── Helpers de permisos ──────────────────────────────────────

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin and p.active from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.member_role(cid uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.client_members m
  join public.profiles p on p.id = m.user_id and p.active
  where m.client_id = cid and m.user_id = auth.uid()
$$;

create or replace function public.can_view_client(cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or public.member_role(cid) is not null
$$;

create or replace function public.can_edit_client(cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or coalesce(public.member_role(cid) = 'editor', false)
$$;

-- ── Triggers ─────────────────────────────────────────────────

-- client_id denormalizado en pieces (simplifica RLS y consultas)
create or replace function public.pieces_set_client()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select g.client_id into new.client_id from public.grids g where g.id = new.grid_id;
  new.updated_at := now();
  return new;
end $$;

create or replace trigger trg_pieces_set_client before insert or update on public.pieces
  for each row execute function public.pieces_set_client();

-- Historial de estados + aviso push cuando hay material para revisar
create or replace function public.pieces_log_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  client_name text;
begin
  if tg_op = 'INSERT' then
    insert into public.piece_events (piece_id, actor_id, type, to_status)
    values (new.id, auth.uid(), 'creada', new.status);
  elsif new.status is distinct from old.status then
    insert into public.piece_events (piece_id, actor_id, type, from_status, to_status)
    values (new.id, auth.uid(), 'estado', old.status, new.status);

    if new.status = 'material_por_revisar' then
      select c.name into client_name from public.clients c where c.id = new.client_id;
      perform net.http_post(
        url := 'https://ntfy.sh',
        body := jsonb_build_object(
          'topic', 'quantro-studio-v7r2k9xq4m',
          'title', 'Material para revisar · ' || coalesce(client_name, ''),
          'tags', jsonb_build_array('clapper'),
          'message', coalesce('#' || new.number || ' ', '') || new.title,
          'click', 'https://quantrodata.com/app/revisar'
        )
      );
    end if;
  end if;
  return new;
end $$;

create or replace trigger trg_pieces_log_status after insert or update of status on public.pieces
  for each row execute function public.pieces_log_status();

-- Cuando todas las partes quedan subidas, la pieza pasa a "material por revisar".
-- La confirmación final (material_completo) siempre es humana (editor/admin).
create or replace function public.parts_set_uploaded_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'subido' and (tg_op = 'INSERT' or old.status <> 'subido') then
    new.uploaded_at := coalesce(new.uploaded_at, now());
  end if;
  return new;
end $$;

create or replace trigger trg_parts_uploaded_at before insert or update on public.piece_parts
  for each row execute function public.parts_set_uploaded_at();

create or replace function public.parts_advance_piece()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := coalesce(new.piece_id, old.piece_id);
begin
  if exists (select 1 from public.piece_parts where piece_id = pid)
     and not exists (select 1 from public.piece_parts where piece_id = pid and status <> 'subido') then
    update public.pieces set status = 'material_por_revisar'
    where id = pid and status in ('idea', 'aprobada', 'en_grabacion');
  end if;
  return null;
end $$;

create or replace trigger trg_parts_advance_piece after insert or update of status on public.piece_parts
  for each row execute function public.parts_advance_piece();

-- ── RPCs (acciones con reglas propias) ───────────────────────

-- Talent marca su parte como subida (o editor/admin cualquiera)
create or replace function public.mark_part_uploaded(part_id uuid, url text default null, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  part public.piece_parts;
  cid uuid;
begin
  select * into part from public.piece_parts where id = part_id;
  if part.id is null then raise exception 'Parte no encontrada'; end if;
  select client_id into cid from public.pieces where id = part.piece_id;
  if not (part.assignee_id = auth.uid() and public.can_view_client(cid)) and not public.can_edit_client(cid) then
    raise exception 'Sin permiso para esta parte';
  end if;
  update public.piece_parts
     set status = 'subido', drive_url = coalesce(nullif(url, ''), drive_url),
         note = coalesce(nullif(mark_part_uploaded.note, ''), piece_parts.note), uploaded_at = now()
   where id = part_id;
  insert into public.piece_events (piece_id, actor_id, type, detail)
  values (part.piece_id, auth.uid(), 'parte_subida', part.description);
end $$;

-- Material a nivel de pieza (un solo link con todo el reel)
create or replace function public.submit_piece_material(p_piece_id uuid, url text, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pc public.pieces;
begin
  select * into pc from public.pieces where id = p_piece_id;
  if pc.id is null or not public.can_view_client(pc.client_id) then raise exception 'Sin permiso'; end if;
  update public.piece_parts
     set status = 'subido', drive_url = coalesce(drive_url, url), uploaded_at = now()
   where piece_id = p_piece_id and status <> 'subido'
     and (assignee_id = auth.uid() or public.can_edit_client(pc.client_id));
  update public.pieces
     set drive_raw_url = url,
         status = case when status in ('idea', 'aprobada', 'en_grabacion') then 'material_por_revisar' else status end
   where id = p_piece_id;
  insert into public.piece_events (piece_id, actor_id, type, detail)
  values (p_piece_id, auth.uid(), 'material_pieza', coalesce(nullif(note, ''), url));
  if nullif(note, '') is not null then
    insert into public.comments (piece_id, author_id, body) values (p_piece_id, auth.uid(), note);
  end if;
end $$;

-- Carpeta que cubre varias piezas de la grilla
create or replace function public.submit_grid_upload(p_grid_id uuid, url text, p_piece_ids uuid[], note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  cid uuid;
  pid uuid;
begin
  select client_id into cid from public.grids where id = p_grid_id;
  if cid is null or not public.can_view_client(cid) then raise exception 'Sin permiso'; end if;
  insert into public.grid_uploads (grid_id, uploader_id, drive_url, note, piece_ids)
  values (p_grid_id, auth.uid(), url, note, p_piece_ids);
  foreach pid in array p_piece_ids loop
    if exists (select 1 from public.pieces where id = pid and grid_id = p_grid_id) then
      update public.piece_parts
         set status = 'subido', drive_url = coalesce(drive_url, url), uploaded_at = now()
       where piece_id = pid and status <> 'subido'
         and (assignee_id = auth.uid() or public.can_edit_client(cid));
      update public.pieces
         set drive_raw_url = coalesce(drive_raw_url, url),
             status = case when status in ('idea', 'aprobada', 'en_grabacion') then 'material_por_revisar' else status end
       where id = pid;
      insert into public.piece_events (piece_id, actor_id, type, detail)
      values (pid, auth.uid(), 'material_carpeta', url);
    end if;
  end loop;
end $$;

-- Vale/Pablo confirman el material o lo devuelven indicando qué falta
create or replace function public.review_material(p_piece_id uuid, approve boolean, comment text default null, reject_part_ids uuid[] default '{}')
returns void language plpgsql security definer set search_path = '' as $$
declare
  pc public.pieces;
begin
  select * into pc from public.pieces where id = p_piece_id;
  if pc.id is null or not public.can_edit_client(pc.client_id) then raise exception 'Solo edición puede revisar material'; end if;
  if approve then
    update public.pieces set status = 'material_completo' where id = p_piece_id;
  else
    update public.piece_parts set status = 'rechazado'
     where piece_id = p_piece_id and id = any (reject_part_ids);
    update public.pieces set status = 'en_grabacion' where id = p_piece_id;
  end if;
  if nullif(comment, '') is not null then
    insert into public.comments (piece_id, author_id, body)
    values (p_piece_id, auth.uid(), case when approve then comment else '⚠️ Falta: ' || comment end);
  end if;
  insert into public.piece_events (piece_id, actor_id, type, detail)
  values (p_piece_id, auth.uid(), case when approve then 'material_confirmado' else 'material_devuelto' end, comment);
end $$;

-- Solo usuarios con sesión ejecutan las funciones; los triggers no se exponen como RPC
revoke execute on function public.is_admin(), public.member_role(uuid), public.can_view_client(uuid), public.can_edit_client(uuid),
  public.mark_part_uploaded(uuid, text, text), public.submit_piece_material(uuid, text, text),
  public.submit_grid_upload(uuid, text, uuid[], text), public.review_material(uuid, boolean, text, uuid[]),
  public.pieces_set_client(), public.pieces_log_status(), public.parts_set_uploaded_at(), public.parts_advance_piece()
  from public, anon;
revoke execute on function public.pieces_set_client(), public.pieces_log_status(), public.parts_set_uploaded_at(), public.parts_advance_piece()
  from authenticated;
grant execute on function public.is_admin(), public.member_role(uuid), public.can_view_client(uuid), public.can_edit_client(uuid),
  public.mark_part_uploaded(uuid, text, text), public.submit_piece_material(uuid, text, text),
  public.submit_grid_upload(uuid, text, uuid[], text), public.review_material(uuid, boolean, text, uuid[])
  to authenticated;

-- ── Plazos calculados hacia atrás desde la fecha de publicación ──

create or replace view public.piece_deadlines with (security_invoker = true) as
select
  p.id as piece_id,
  p.client_id,
  p.publish_date,
  p.publish_date - c.schedule_buffer_days                        as schedule_due,
  p.publish_date - c.schedule_buffer_days - c.edit_buffer_days   as material_due
from public.pieces p
join public.clients c on c.id = p.client_id;

-- ── RLS ──────────────────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.clients        enable row level security;
alter table public.client_members enable row level security;
alter table public.grids          enable row level security;
alter table public.pieces         enable row level security;
alter table public.piece_parts    enable row level security;
alter table public.piece_events   enable row level security;
alter table public.comments       enable row level security;
alter table public.grid_uploads   enable row level security;
alter table public.reminder_log   enable row level security;

-- profiles: cada uno se ve a sí mismo; se ven quienes comparten cliente; admin ve todo.
-- Escritura solo vía service role (api/admin-users.js), para que nadie se haga admin.
-- (todos ven a los admins: Pablo aparece como responsable de partes)
create policy "profiles_select" on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin() or is_admin or exists (
    select 1 from public.client_members a
    join public.client_members b on a.client_id = b.client_id
    where a.user_id = auth.uid() and b.user_id = profiles.id
  )
);

create policy "clients_select" on public.clients for select to authenticated using (public.can_view_client(id));
create policy "clients_admin_all" on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "members_select" on public.client_members for select to authenticated
  using (public.can_view_client(client_id));
create policy "members_admin_all" on public.client_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "grids_select" on public.grids for select to authenticated using (public.can_view_client(client_id));
create policy "grids_edit" on public.grids for all to authenticated
  using (public.can_edit_client(client_id)) with check (public.can_edit_client(client_id));

create policy "pieces_select" on public.pieces for select to authenticated using (public.can_view_client(client_id));
create policy "pieces_insert" on public.pieces for insert to authenticated
  with check (public.can_edit_client((select g.client_id from public.grids g where g.id = grid_id)));
create policy "pieces_update" on public.pieces for update to authenticated
  using (public.can_edit_client(client_id))
  with check (public.can_edit_client((select g.client_id from public.grids g where g.id = grid_id)));
create policy "pieces_delete" on public.pieces for delete to authenticated using (public.can_edit_client(client_id));

create policy "parts_select" on public.piece_parts for select to authenticated using (
  public.can_view_client((select p.client_id from public.pieces p where p.id = piece_id)));
create policy "parts_edit" on public.piece_parts for all to authenticated
  using (public.can_edit_client((select p.client_id from public.pieces p where p.id = piece_id)))
  with check (public.can_edit_client((select p.client_id from public.pieces p where p.id = piece_id)));

create policy "events_select" on public.piece_events for select to authenticated using (
  public.can_view_client((select p.client_id from public.pieces p where p.id = piece_id)));

create policy "comments_select" on public.comments for select to authenticated using (
  public.can_view_client((select p.client_id from public.pieces p where p.id = piece_id)));
create policy "comments_insert" on public.comments for insert to authenticated with check (
  author_id = auth.uid() and public.can_view_client((select p.client_id from public.pieces p where p.id = piece_id)));
create policy "comments_delete" on public.comments for delete to authenticated using (
  author_id = auth.uid() or public.is_admin());

create policy "grid_uploads_select" on public.grid_uploads for select to authenticated using (
  public.can_view_client((select g.client_id from public.grids g where g.id = grid_id)));

-- reminder_log: sin políticas → solo service role.

-- ── Realtime ─────────────────────────────────────────────────
alter publication supabase_realtime add table public.pieces, public.piece_parts, public.comments;
