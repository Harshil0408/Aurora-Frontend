import type { MetadataRoute } from 'next';
import { buildSitemap } from '@/lib/seo';

/** Thin route wrapper — entries live in `src/lib/seo.ts` (unit-tested). */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap();
}
