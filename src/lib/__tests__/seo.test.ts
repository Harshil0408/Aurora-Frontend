import { buildRobots, buildSitemap, isPrivatePath } from '@/lib/seo';
import { config } from '@/lib/config';

describe('seo (crawl scaffolding)', () => {
  describe('isPrivatePath', () => {
    it('flags panel, API and media paths', () => {
      expect(isPrivatePath('/admin')).toBe(true);
      expect(isPrivatePath('/admin/login')).toBe(true);
      expect(isPrivatePath('/seller/stores/abc')).toBe(true);
      expect(isPrivatePath('/api/v1/admin/me')).toBe(true);
      expect(isPrivatePath('/uploads/public/x.png')).toBe(true);
    });

    it('allows future public storefront paths', () => {
      expect(isPrivatePath('/')).toBe(false);
      expect(isPrivatePath('/p/some-product')).toBe(false);
      expect(isPrivatePath('/c/apparel')).toBe(false);
    });
  });

  describe('buildRobots', () => {
    const robots = buildRobots();
    const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;

    it('disallows every private prefix and references the sitemap', () => {
      expect(rule?.userAgent).toBe('*');
      expect(rule?.disallow).toEqual(
        expect.arrayContaining(['/admin/', '/seller/', '/api/', '/uploads/']),
      );
      expect(robots.sitemap).toBe(`${config.siteUrl}/sitemap.xml`);
    });

    it('does not allow crawlers into the console', () => {
      // `allow: '/'` only wins for paths no disallow prefix matches —
      // assert no disallow entry is missing and allow stays root-level.
      expect(rule?.allow).toBe('/');
      expect(rule?.disallow).not.toContain('/admin');
      expect(rule?.disallow).toContain('/admin/');
    });
  });

  describe('buildSitemap', () => {
    it('never lists private panel paths', () => {
      for (const entry of buildSitemap()) {
        expect(isPrivatePath(new URL(entry.url).pathname)).toBe(false);
      }
    });

    it('uses absolute urls on the configured site origin', () => {
      for (const entry of buildSitemap()) {
        expect(entry.url.startsWith(config.siteUrl)).toBe(true);
      }
    });
  });
});
