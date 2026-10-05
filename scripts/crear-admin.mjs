// Crea o actualiza un usuario del administrador.
// Uso: npm run crear-admin -- correo@ejemplo.com "contraseña-segura" "Nombre"
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { loadEnv } from './env.mjs';
loadEnv();
const [email, pass, nombre = ''] = process.argv.slice(2);
if (!email || !pass) { console.error('Uso: npm run crear-admin -- correo@ejemplo.com "contraseña" "Nombre"'); process.exit(1); }
if (pass.length < 10) { console.error('La contraseña debe tener al menos 10 caracteres.'); process.exit(1); }
const url = process.env.DATABASE_URL;
const sql = postgres(url, { ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require', max: 1 });
const hash = await bcrypt.hash(pass, 12);
await sql`insert into admins (email, nombre, hash) values (${email.toLowerCase().trim()}, ${nombre}, ${hash})
  on conflict (email) do update set hash = excluded.hash, nombre = excluded.nombre`;
console.log('Administrador listo:', email);
await sql.end();
