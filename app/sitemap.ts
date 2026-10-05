import type { MetadataRoute } from 'next';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await sql`select id, actualizado_at from productos order by orden desc`;
  return [
    { url: SITE + '/', changeFrequency: 'daily', priority: 1 },
    ...rows.map((r: any) => ({ url: `${SITE}/p/${r.id}`, lastModified: r.actualizado_at, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
