-- Log de eventos del experimento. Se ejecuta una vez en el SQL Editor de Neon.
create table events (
  id         bigint generated always as identity primary key,
  visitor_id text        not null,
  variant    text        not null check (variant in ('a', 'b')),
  type       text        not null check (type in ('impression', 'conversion')),
  created_at timestamptz not null default now()
);

-- Una sola conversión por visitante, aunque lleguen clics repetidos o simultáneos.
create unique index one_conversion_per_visitor
  on events (visitor_id) where type = 'conversion';
