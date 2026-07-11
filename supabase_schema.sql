-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- (supabase.com → tu proyecto → SQL Editor → New Query)

create table if not exists contact_leads (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now() not null,
  name       text        not null,
  email      text        not null,
  company    text,
  phone      text,
  services   text[]      default '{}',
  message    text
);

-- Índice para búsqueda rápida por email
create index if not exists contact_leads_email_idx on contact_leads (email);

-- Row Level Security: solo el backend (service role) puede leer.
-- El anon key solo puede insertar (para el formulario público).
alter table contact_leads enable row level security;

create policy "Permitir inserción pública"
  on contact_leads for insert
  to anon
  with check (true);

-- Para leer los leads desde el dashboard de Supabase usa el service_role key
-- o crea una política authenticated si quieres un panel de admin propio.

-- ─────────────────────────────────────────────────────────────
-- Notificaciones de leads (aplicado 2026-07-10 vía MCP)
-- Al insertarse un lead: push vía ntfy.sh (topic quantro-leads-qd8k3x7m2p)
-- + email a quantrodata@gmail.com vía FormSubmit.
-- La función vive en la base como public.notify_new_lead()
-- (SECURITY DEFINER, sin EXECUTE para anon/authenticated; solo el trigger).
-- Trigger: trg_notify_new_lead AFTER INSERT ON contact_leads.
-- Keepalive: Vercel Cron diario → /api/keepalive (evita la pausa por
-- inactividad del plan gratuito de Supabase).
