import {
  compact,
  int,
  money,
  salesData,
  summarise,
  topProducts,
  topSellers,
  feedEvents,
  healthMeters,
  healthServices,
  revenueSegments,
} from '@/lib/sampleData';

describe('sampleData (dashboard math must never NaN)', () => {
  it('sales ranges all well-formed with matching lengths', () => {
    for (const key of ['daily', 'weekly', 'monthly', 'yearly'] as const) {
      const s = salesData[key];
      expect(s.cur.length).toBeGreaterThan(0);
      expect(s.cur.length).toBe(s.prev.length);
      expect(s.cur.length).toBe(s.labels.length);
      expect(s.cur.every((v) => Number.isFinite(v) && v > 0)).toBe(true);
    }
    expect(salesData.daily.cur.length).toBe(30);
    expect(salesData.yearly.labels).toEqual(
      expect.arrayContaining(['2022', '2026']),
    );
  });

  it('summarise returns finite sales/orders/aov + deltas', () => {
    for (const key of Object.keys(salesData) as (keyof typeof salesData)[]) {
      const out = summarise(salesData[key]);
      for (const v of [
        out.sales,
        out.orders,
        out.aov,
        out.dSales,
        out.dOrders,
        out.dAov,
      ]) {
        expect(Number.isFinite(v)).toBe(true);
      }
      expect(out.sales).toBeGreaterThan(0);
      expect(out.orders).toBeGreaterThan(0);
    }
  });

  it('formatters handle boundaries', () => {
    expect(int(1234.6)).toBe('1,235');
    expect(money(1500)).toBe('$1,500');
    expect(compact(500)).toBe('$500');
    expect(compact(1500)).toMatch(/\$1\.5k/);
    expect(compact(2_500_000)).toMatch(/\$2\.5M/);
    expect(compact(0)).toBe('$0');
  });

  it('ranked lists + health fixtures sane', () => {
    expect(topSellers.length).toBeGreaterThan(0);
    expect(topSellers.every((s) => s.barPct >= 0 && s.barPct <= 100)).toBe(
      true,
    );
    expect(topProducts.every((p) => p.revenue > 0)).toBe(true);
    expect(feedEvents.length).toBeGreaterThan(0);
    expect(healthServices.every((h) => h.name.length > 0)).toBe(true);
    expect(healthMeters.every((m) => m.pct >= 0 && m.pct <= 100)).toBe(true);
    const totalPct = revenueSegments.reduce((a, s) => a + s.pct, 0);
    expect(totalPct).toBeGreaterThan(99);
    expect(totalPct).toBeLessThan(101);
  });
});
