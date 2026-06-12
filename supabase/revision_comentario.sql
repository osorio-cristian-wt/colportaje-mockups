-- ============================================================================
-- Tabla para recolectar los comentarios de revisión de los mockups.
-- Ejecutar una vez en: Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- NO contiene PII de clientes: solo feedback sobre las pantallas de diseño.
-- Por eso se permite INSERT anónimo (rol anon) desde el sitio estático.
-- ============================================================================

create table if not exists public.revision_comentario (
  id          uuid primary key default gen_random_uuid(),
  vista       text not null,                 -- 'colportor' | 'admin' | 'coordinador'
  tab         text not null,                 -- pantalla/tab activa (ej. 'Mapa')
  x           integer not null,              -- coord X de la zona (px, relativa al contenedor)
  y           integer not null,              -- coord Y de la zona (incluye scroll del contenido)
  ancho       integer,                       -- ancho de la zona arrastrada (px)
  alto        integer,                       -- alto de la zona arrastrada (px)
  scroll_y    integer,                       -- posición de scroll de la página al comentar
  comentario  text not null,
  autor       text,                          -- nombre opcional del revisor
  vw          integer,                       -- ancho de viewport del revisor
  vh          integer,                       -- alto de viewport del revisor
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Índice para listar por vista/pantalla al revisar el feedback.
create index if not exists idx_revision_comentario_vista on public.revision_comentario (vista, tab, created_at desc);

-- RLS: el sitio estático usa la anon key. Solo se permite INSERT anónimo;
-- la lectura queda reservada a usuarios autenticados (vos, desde el dashboard).
alter table public.revision_comentario enable row level security;

drop policy if exists "anon puede insertar comentarios" on public.revision_comentario;
create policy "anon puede insertar comentarios"
  on public.revision_comentario
  for insert
  to anon
  with check (true);

drop policy if exists "authenticated puede leer comentarios" on public.revision_comentario;
create policy "authenticated puede leer comentarios"
  on public.revision_comentario
  for select
  to authenticated
  using (true);
