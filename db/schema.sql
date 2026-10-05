-- Atelier Parfums — esquema de base de datos (PostgreSQL / Supabase)
-- Se puede correr varias veces sin romper nada (idempotente).

create table if not exists productos (
  id          text primary key,
  marca       text not null,
  nombre      text not null,
  conc        text not null default 'EDP' check (conc in ('EDP','EDT','Parfum')),
  ml          text not null default '100',
  genero      text not null default 'Mujer' check (genero in ('Mujer','Hombre','Unisex')),
  linea       text not null default 'De diseñador' check (linea in ('Árabes','De diseñador')),
  fam         text not null default 'florales' check (fam in ('frescos','florales','dulces','amaderados','orientales','acuaticos')),
  precio      integer not null check (precio > 0),
  descuento   integer not null default 0 check (descuento between 0 and 90),
  estado      text not null default 'disponible' check (estado in ('disponible','pocas','agotado')),
  nuevo       boolean not null default false,
  s           text not null default '',
  c           text not null default '',
  f           text not null default '',
  descr       text not null default '',
  temp        text[] not null default '{}',
  mom         text[] not null default '{}',
  dur         smallint not null default 3 check (dur between 1 and 5),
  est         smallint not null default 3 check (est between 1 and 5),
  orden       bigint not null default 0,          -- más alto = aparece primero
  creado_at   timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create table if not exists resenas (
  id         text primary key default ('r' || replace(gen_random_uuid()::text, '-', '')),
  pid        text references productos(id) on delete set null,
  nombre     text not null,
  estrellas  smallint not null check (estrellas between 1 and 5),
  titulo     text not null default '',
  texto      text not null,
  estado     text not null default 'pendiente' check (estado in ('pendiente','publicada','oculta')),
  creado_at  timestamptz not null default now()
);
create index if not exists resenas_estado_idx on resenas (estado);

create sequence if not exists pedido_seq;
create table if not exists pedidos (
  id         text primary key default ('P-' || lpad(nextval('pedido_seq')::text, 4, '0')),
  nombre     text not null default '[Sin nombre]',
  items      jsonb not null,                      -- [{ pid, n, precio }]
  total      integer not null default 0,
  estado     text not null default 'Por confirmar' check (estado in ('Por confirmar','Confirmado','Enviado','Entregado','Cancelado')),
  creado_at  timestamptz not null default now()
);
create index if not exists pedidos_creado_idx on pedidos (creado_at desc);
-- Datos de entrega del carrito (paso Envío / Pago)
alter table pedidos add column if not exists telefono  text not null default '';
alter table pedidos add column if not exists zona      text not null default '';
alter table pedidos add column if not exists direccion text not null default '';
alter table pedidos add column if not exists ubicacion text not null default '';
alter table pedidos add column if not exists notas     text not null default '';
alter table pedidos add column if not exists pago      text not null default '';
alter table pedidos add column if not exists envio     integer;
alter table pedidos add column if not exists subtotal  integer;

create table if not exists ajustes (
  id         smallint primary key default 1 check (id = 1),
  wa         text not null default '',
  anuncio    text not null default 'Perfumes 100% originales · Pide por WhatsApp',
  direccion  text not null default '',
  horario    text not null default '',
  instagram  text not null default '',
  facebook   text not null default '',
  tiktok     text not null default ''
);
-- Textos del negocio (pagos, envíos, garantía, ofertas y cambios). Se editan en Ajustes.
alter table ajustes add column if not exists pagos    text not null default '';
alter table ajustes add column if not exists envios   text not null default '';
alter table ajustes add column if not exists garantia text not null default '';
alter table ajustes add column if not exists ofertas  text not null default '';
alter table ajustes add column if not exists cambios  text not null default '';
-- Envíos y pago (texto vacío = "por confirmar")
alter table ajustes add column if not exists envio_tegus    text not null default '';
alter table ajustes add column if not exists envio_nacional text not null default '';
alter table ajustes add column if not exists envio_gratis   text not null default '';
alter table ajustes add column if not exists banco          text not null default '';
insert into ajustes (id) values (1) on conflict do nothing;

-- Fotos: una URL por espacio ('foto-<productoId>-<1..4>', 'hero-editorial', 'categoria-<slug>')
create table if not exists fotos (
  slot       text primary key,
  url        text not null,
  path       text not null default '',
  actualizado_at timestamptz not null default now()
);

-- Analítica anónima (sin datos personales)
create table if not exists eventos (
  id     bigserial primary key,
  t      bigint not null,                          -- timestamp en ms
  tipo   text not null check (tipo in ('visita','clic','vista','whatsapp','agregar','pedido','aviso','busqueda','categoria')),
  vid    text not null,
  dev    text not null check (dev in ('mob','desk')),
  pid    text,
  cat    text,
  q      text,
  res    integer,
  total  integer,
  pids   text[]
);
create index if not exists eventos_t_idx on eventos (t);

create table if not exists admins (
  email      text primary key,
  nombre     text not null default '',
  hash       text not null,
  creado_at  timestamptz not null default now()
);

-- Seguridad: todo pasa por la API del servidor. Con RLS activo y sin políticas,
-- las claves públicas de Supabase (anon) no pueden leer ni escribir nada.
alter table productos enable row level security;
alter table resenas  enable row level security;
alter table pedidos  enable row level security;
alter table ajustes  enable row level security;
alter table fotos    enable row level security;
alter table eventos  enable row level security;
alter table admins   enable row level security;

-- Clientes (inicio de sesión opcional con Google)
create table if not exists clientes (
  id         text primary key,                    -- "sub" de Google
  email      text not null,
  nombre     text not null default '',
  foto       text not null default '',
  telefono   text not null default '',
  zona       text not null default '',
  direccion  text not null default '',
  creado_at  timestamptz not null default now(),
  visto_at   timestamptz not null default now()
);
alter table pedidos add column if not exists cliente_id text references clientes(id) on delete set null;
create index if not exists pedidos_cliente_idx on pedidos (cliente_id);

-- Encargos: perfumes que el cliente pide y no están en el catálogo
create sequence if not exists encargo_seq;
create table if not exists encargos (
  id         text primary key default ('E-' || lpad(nextval('encargo_seq')::text, 4, '0')),
  perfume    text not null,
  detalles   text not null default '',
  nombre     text not null,
  telefono   text not null,
  cliente_id text references clientes(id) on delete set null,
  estado     text not null default 'Nuevo' check (estado in ('Nuevo','Cotizado','Pedido al proveedor','Listo para entregar','Entregado','Cancelado')),
  creado_at  timestamptz not null default now()
);
create index if not exists encargos_creado_idx on encargos (creado_at desc);
alter table clientes enable row level security;
alter table encargos enable row level security;
