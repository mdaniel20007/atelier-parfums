# Atelier Parfums — tienda + administrador

Tienda de perfumes (catálogo, "Mi pedido" por WhatsApp, reseñas) y panel de administración
(productos, pedidos, reseñas, ajustes y métricas).

**Stack:** Next.js 16 (App Router) · PostgreSQL (Supabase) · Supabase Storage para fotos · Vercel.

---

## Cómo está armado

```
app/
  page.tsx              Tienda (se sirve con los datos ya cargados desde el servidor)
  p/[id]/page.tsx       Enlace para compartir un perfume: vista previa con foto, nombre y precio
  admin/page.tsx        Panel (pide iniciar sesión)
  api/                  API (ver tabla abajo)
  sitemap.ts, robots.ts SEO
components/             Tienda, Administrador, TarjetaProducto, ImageSlot, Login
lib/
  db.ts                 Conexión a Postgres
  auth.ts               Sesión del admin (cookie firmada), límites por IP, manejo de errores
  datos.ts              Consultas y validación del lado del servidor
  storage.ts            Subida de fotos (Supabase Storage; en local, carpeta .uploads)
  atelier-datos.js      Capa de datos del navegador (misma interfaz que el prototipo, conectada a la API)
  atelier-metricas.js   Cálculo de los tableros
db/schema.sql           Tablas (se puede correr varias veces)
scripts/                migrate.mjs, crear-admin.mjs
tools/convert-dc.mjs    Convertidor usado una vez para portar los prototipos .dc.html a React
```

### API

| Ruta | Quién | Qué hace |
|---|---|---|
| `GET /api/tienda` | público | Productos, reseñas publicadas, ajustes y fotos |
| `POST /api/pedidos` | público | Registra el pedido como "Por confirmar". **Los precios se recalculan en el servidor** |
| `POST /api/resenas` | público | Crea la reseña como `pendiente` |
| `POST /api/eventos` | público | Analítica anónima (lotes con `sendBeacon`) |
| `GET /api/admin/datos` | admin | Todo, incluidos pedidos y reseñas pendientes |
| `PUT/DELETE /api/productos/:id` | admin | Crear/editar/eliminar producto |
| `PATCH/DELETE /api/pedidos/:id`, `/api/resenas/:id` | admin | Cambiar estado / eliminar |
| `PATCH /api/ajustes` | admin | WhatsApp, anuncio, dirección, redes y textos (pagos, envíos, garantía, ofertas, cambios) |
| `POST/DELETE /api/fotos` | admin | Subir o quitar la foto de un espacio |
| `GET/DELETE /api/eventos` | admin | Eventos para métricas / borrarlos |
| `POST /api/auth/login`, `/logout` | — | Sesión del administrador |

Las rutas públicas tienen validación y un límite simple de solicitudes por IP.
Las tablas tienen RLS activado sin políticas: las claves públicas de Supabase no pueden leer ni escribir nada;
todo pasa por esta API.

---

## Correr en tu computadora

Requisitos: Node 20+ y un Postgres (local o el de Supabase).

```bash
npm install
cp .env.example .env.local      # y completa DATABASE_URL y SESSION_SECRET
npm run db:migrate
npm run crear-admin -- tu@correo.com "una-contraseña-larga" "Daniel"
npm run dev
```

- Tienda: http://localhost:3000
- Admin: http://localhost:3000/admin

Sin `SUPABASE_URL`, las fotos se guardan en la carpeta `.uploads` (solo para desarrollo).

---

## Ponerlo en producción (Supabase + Vercel)

### 1. Supabase
1. Crea un proyecto en https://supabase.com (región: `us-east-1` es la más cercana a Honduras).
2. **Base de datos:** Project Settings → Database → *Connection string* → **Transaction pooler** (puerto 6543).
   Esa es tu `DATABASE_URL`.
3. **Tablas:** en tu computadora, con esa `DATABASE_URL` en `.env.local`:
   ```bash
   npm run db:migrate
   npm run crear-admin -- tu@correo.com "contraseña-larga" "Daniel"
   npm run crear-admin -- correo-de-tu-socio@gmail.com "otra-contraseña" "Socio"
   ```
   (También puedes pegar `db/schema.sql` en el SQL Editor de Supabase.)
4. **Fotos:** Storage → *New bucket* → nombre `fotos` → márcalo como **Public**.
5. Project Settings → API: copia la **Project URL** (`SUPABASE_URL`) y la clave **service_role**
   (`SUPABASE_SERVICE_ROLE_KEY`). La service_role es secreta: solo va en Vercel, nunca en el código.

### 2. Vercel
1. Sube este proyecto a un repositorio de GitHub (privado).
2. En https://vercel.com → *Add New Project* → importa el repositorio (Vercel detecta Next.js solo).
3. En *Environment Variables* agrega:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la del Transaction pooler |
   | `SESSION_SECRET` | 64 caracteres al azar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | la clave service_role |
   | `SUPABASE_BUCKET` | `fotos` |
   | `NEXT_PUBLIC_SITE_URL` | tu dominio final, p. ej. `https://atelierparfums.com` |

4. *Deploy*. En Settings → Functions, pon la región en **Washington, D.C. (iad1)** para que quede junto a Supabase.
5. Dominio propio (opcional): Settings → Domains.

### 3. Primeros pasos en el panel
1. Entra a `/admin` con tu correo.
2. **Ajustes:** número de WhatsApp (con 504), dirección, horario, redes y los textos de pagos, envíos,
   garantía, ofertas y cambios (aparecen en "¿Por qué comprar con nosotros?" y en Preguntas frecuentes).
   Ahí mismo sube la foto principal y la de cada categoría.
3. **Productos:** agrega cada perfume con sus 4 fotos (se reducen solas antes de subirse).
4. En la bio de Instagram pon el enlace de la tienda. Para compartir un perfume concreto usa
   `https://tu-dominio/p/<id-del-producto>`: en WhatsApp e Instagram se ve con foto, nombre y precio.

---

## Notas
- Los pedidos no se cobran en la web: el cliente envía la lista por WhatsApp y queda registrada en el panel.
- "Mi pedido" se guarda en el teléfono del cliente; si la página se recarga, no se pierde.
- El botón "atrás" del celular navega dentro de la tienda (inicio → catálogo → perfume).
- La analítica es anónima (un id al azar por navegador, sin datos personales).
- El límite de solicitudes por IP vive en memoria de cada instancia; si algún día hay abuso real,
  conviene moverlo a Upstash/Redis o a Vercel Firewall.
