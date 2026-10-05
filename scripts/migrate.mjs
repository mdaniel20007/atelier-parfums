// Crea las tablas en la base de datos indicada por DATABASE_URL.
import fs from 'node:fs';
import postgres from 'postgres';
import { loadEnv } from './env.mjs';
loadEnv();
const url = process.env.DATABASE_URL;
if (!url) { console.error('Falta DATABASE_URL (ponla en .env.local)'); process.exit(1); }
const sql = postgres(url, { ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require', max: 1, onnotice: () => {} });
await sql.unsafe(fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
console.log('Base de datos lista.');
await sql.end();
