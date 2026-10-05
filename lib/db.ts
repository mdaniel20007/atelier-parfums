import postgres from 'postgres';

declare global { var __atelierSql: ReturnType<typeof postgres> | undefined; }

function crear() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta la variable DATABASE_URL');
  const local = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, {
    ssl: local ? false : 'require',
    max: local ? 5 : 3,
    idle_timeout: 20,
    prepare: false, // necesario con el pooler de Supabase (modo transacción)
    onnotice: () => {},
  });
}

export const sql = globalThis.__atelierSql ?? (globalThis.__atelierSql = crear());
