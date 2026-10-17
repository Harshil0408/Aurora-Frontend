import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

/** URL prefixes that must never be indexed or sitemapped (private panels). */
const PRIVATE_PREFIXES = ['/admin', '/seller', '/api', '/uploads'];

/** True when `path` is a private/panel path. */
export function isPrivatePath(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Crawl rules for the console. There are no indexable shopper routes yet;
 * when the storefront lands at the site root, add `allow` entries for its
 * prefixes. Panels, BFF API and media rewrites are never crawlable.
 */
export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/seller/', '/api/', '/uploads/'],
      },
    ],
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}

/**
 * Public indexable URLs. The shopper storefront (server-rendered catalog)
 * lands here once those routes exist; the admin/seller panels never do.
 */
export function buildSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    // Shopper storefront (marketing/catalog) goes here, e.g.:
    // { url: `${config.siteUrl}/p/${slug}`, lastModified, changeFrequency, priority },
  ];
  return entries.filter((e) => !isPrivatePath(new URL(e.url).pathname));
}
