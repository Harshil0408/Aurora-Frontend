import type { MetadataRoute } from 'next';
import { buildRobots } from '@/lib/seo';

/** Thin route wrapper — rules live in `src/lib/seo.ts` (unit-tested). */
export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
