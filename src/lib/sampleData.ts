/**
 * Deterministic sample data for the dashboard preview.
 * Ported from the reference UI (ui/files/app.js). Replace these builders
 * with API responses when catalogue/analytics endpoints land.
 * Assumption: USD sample figures; footer labels them as design preview data.
 */

export type SalesRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SalesSeries {
  labels: string[];
  full: string[];
  cur: number[];
  prev: number[];
  sub: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY = new Date(2026, 8, 21);

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(26);
const jitter = (p: number) => 1 + (R() * 2 - 1) * p;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

function buildDaily(): SalesSeries {
  const o: SalesSeries = { labels: [], full: [], cur: [], prev: [], sub: 'last 30 days' };
  for (let k = 0; k < 30; k++) {
    const d = addDays(TODAY, k - 29);
    const wk = [0, 6].includes(d.getDay()) ? 1.12 : d.getDay() === 1 ? 0.94 : 1;
    const base = (150000 + k * 2600) * wk;
    o.cur.push(Math.round(base * jitter(0.07)));
    o.prev.push(Math.round(base * 0.87 * jitter(0.08)));
    o.labels.push(`${MONTHS[d.getMonth()]} ${d.getDate()}`);
    o.full.push(`${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`);
  }
  return o;
}

function buildWeekly(): SalesSeries {
  const o: SalesSeries = { labels: [], full: [], cur: [], prev: [], sub: 'last 12 weeks' };
  for (let k = 0; k < 12; k++) {
    const d = addDays(TODAY, (k - 11) * 7);
    const base = 1050000 + k * 45000;
    o.cur.push(Math.round(base * jitter(0.05)));
    o.prev.push(Math.round(base * 0.88 * jitter(0.06)));
    o.labels.push(`${MONTHS[d.getMonth()]} ${d.getDate()}`);
    o.full.push(`Week of ${MONTHS[d.getMonth()]} ${d.getDate()}`);
  }
  return o;
}

function buildMonthly(): SalesSeries {
  const o: SalesSeries = { labels: [], full: [], cur: [], prev: [], sub: 'last 12 months' };
  for (let k = 0; k < 12; k++) {
    const d = new Date(2026, 8 - (11 - k), 1);
    const season = [10, 11].includes(d.getMonth()) ? 1.12 : 1;
    const base = (3100000 + k * 220000) * season;
    o.cur.push(Math.round(base * jitter(0.03)));
    o.prev.push(Math.round(base * 0.84 * jitter(0.05)));
    o.labels.push(MONTHS[d.getMonth()]);
    o.full.push(`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`);
  }
  return o;
}

const buildYearly = (): SalesSeries => ({
  labels: ['2022', '2023', '2024', '2025', '2026'],
  full: ['2022', '2023', '2024', '2025', '2026 (year to date)'],
  cur: [14200000, 22800000, 36400000, 51900000, 47600000],
  prev: [9100000, 14200000, 22800000, 36400000, 51900000],
  sub: 'since 2022',
});

export const salesData: Record<SalesRange, SalesSeries> = {
  daily: buildDaily(),
  weekly: buildWeekly(),
  monthly: buildMonthly(),
  yearly: buildYearly(),
};

const aovAt = (i: number, n: number) => 60 + (i / Math.max(1, n - 1)) * 7;

export interface SalesSummary {
  sales: number;
  orders: number;
  aov: number;
  dSales: number;
  dOrders: number;
  dAov: number;
}

export function summarise(d: SalesSeries): SalesSummary {
  const n = d.cur.length;
  let sales = 0;
  let prevSales = 0;
  let orders = 0;
  let prevOrders = 0;
  d.cur.forEach((v, i) => {
    sales += v;
    orders += v / aovAt(i, n);
  });
  d.prev.forEach((v, i) => {
    prevSales += v;
    prevOrders += v / (aovAt(i, n) * 0.97);
  });
  const aov = sales / orders;
  const prevAov = prevSales / prevOrders;
  return {
    sales,
    orders,
    aov,
    dSales: (sales / prevSales - 1) * 100,
    dOrders: (orders / prevOrders - 1) * 100,
    dAov: (aov / prevAov - 1) * 100,
  };
}

/* ---------- Formatting ---------- */
export const int = (n: number) => Math.round(n).toLocaleString('en-US');
export const money = (n: number) => `$${int(n)}`;
export function compact(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '')}k`;
  return `$${Math.round(n)}`;
}

/* ---------- KPI sparklines ---------- */
export const sparkData: Record<string, number[]> = {
  sellers: [1130, 1148, 1152, 1166, 1171, 1180, 1188, 1195, 1204, 1212, 1221, 1230, 1239, 1248],
  users: [188, 191, 193, 196, 195, 199, 202, 204, 203, 207, 209, 211, 213, 214.9],
  orders: [2410, 2520, 2480, 2610, 2570, 2740, 2690, 2810, 2760, 2830, 2790, 2900, 2840, 2864],
  revenue: [11.2, 11.6, 11.4, 12.1, 12.6, 12.3, 13.0, 13.4, 13.1, 13.9, 14.2, 14.0, 14.6, 14.9],
};

/* ---------- Ranked sellers ---------- */
export interface SellerRow {
  initial: string;
  name: string;
  category: string;
  plan: 'Scale' | 'Growth' | 'Starter';
  orders: number;
  sales: number;
  barPct: number;
  growthPct: number;
  tint: string;
}

export const topSellers: SellerRow[] = [
  { initial: 'N', name: 'Northloom Studio', category: 'Home & living', plan: 'Scale', orders: 4812, sales: 412300, barPct: 100, growthPct: 18.2, tint: 'linear-gradient(135deg, #7c63ff, #4327d6)' },
  { initial: 'K', name: 'Kiln & Kettle', category: 'Kitchen', plan: 'Scale', orders: 3960, sales: 351840, barPct: 85, growthPct: 11.4, tint: 'linear-gradient(135deg, #ff9a72, #e0592a)' },
  { initial: 'A', name: 'Aria Electronics', category: 'Electronics', plan: 'Growth', orders: 2204, sales: 318900, barPct: 77, growthPct: 6.9, tint: 'linear-gradient(135deg, #4db3f5, #1f6fc2)' },
  { initial: 'T', name: 'Tidewater Apparel', category: 'Fashion', plan: 'Growth', orders: 5118, sales: 276450, barPct: 67, growthPct: -2.3, tint: 'linear-gradient(135deg, #f06ba0, #b23372)' },
  { initial: 'V', name: 'Verdant Pantry', category: 'Grocery', plan: 'Starter', orders: 6732, sales: 241190, barPct: 58, growthPct: 22.7, tint: 'linear-gradient(135deg, #33c29a, #0e8060)' },
];

/* ---------- Top products (media list) ---------- */
export interface ProductRow {
  name: string;
  detail: string;
  revenue: number;
  tint: string;
  icon: 'bag' | 'box' | 'pulse' | 'store' | 'trend';
}

export const topProducts: ProductRow[] = [
  { name: 'Linen utility jacket', detail: 'Tidewater Apparel · 3,412 units', revenue: 221780, tint: 'linear-gradient(140deg, #4db3f5, #1f6fc2)', icon: 'bag' },
  { name: 'Ceramic pour-over set', detail: 'Kiln & Kettle · 2,905 units', revenue: 174300, tint: 'linear-gradient(140deg, #ff9a72, #e0592a)', icon: 'box' },
  { name: 'Noise-cancelling earbuds', detail: 'Aria Electronics · 1,187 units', revenue: 154310, tint: 'linear-gradient(140deg, #7c63ff, #4327d6)', icon: 'pulse' },
  { name: 'Woven throw blanket', detail: 'Northloom Studio · 2,046 units', revenue: 122760, tint: 'linear-gradient(140deg, #f7c04a, #c48812)', icon: 'store' },
  { name: 'Cold-pressed olive oil, 1 L', detail: 'Verdant Pantry · 5,320 units', revenue: 101080, tint: 'linear-gradient(140deg, #33c29a, #0e8060)', icon: 'trend' },
];

/* ---------- Activity feed ---------- */
export type FeedType = 'sellers' | 'orders' | 'finance';
export type FeedTone = 'brand' | 'good' | 'warn' | 'bad' | 'info';

export interface FeedEvent {
  type: FeedType | 'all';
  tone: FeedTone;
  icon: 'user-plus' | 'alert' | 'check' | 'repeat' | 'refund' | 'flag' | 'users';
  html: string;
  time: string;
  action?: string;
}

export const feedEvents: FeedEvent[] = [
  { type: 'sellers', tone: 'info', icon: 'user-plus', html: '<b>Maple & Moss Candles</b> applied to sell on Aurora', time: '2 minutes ago', action: 'Review' },
  { type: 'orders', tone: 'bad', icon: 'alert', html: 'Order <b>#48213</b> was flagged for a payment check · $1,240.00', time: '9 minutes ago', action: 'Inspect' },
  { type: 'finance', tone: 'good', icon: 'check', html: 'Payout batch of <b>$86,420</b> sent to 214 sellers', time: '26 minutes ago', action: 'Details' },
  { type: 'finance', tone: 'warn', icon: 'repeat', html: '<b>Kiln & Kettle</b> upgraded from Growth to Scale', time: '41 minutes ago', action: 'Open' },
  { type: 'orders', tone: 'warn', icon: 'refund', html: 'Refund requested on order <b>#48177</b> · $64.00', time: '1 hour ago', action: 'Decide' },
  { type: 'sellers', tone: 'bad', icon: 'flag', html: 'Listing <b>Aero Kettle X</b> was reported for misleading claims', time: '2 hours ago', action: 'Moderate' },
  { type: 'all', tone: 'brand', icon: 'users', html: 'Aurora passed <b>200,000</b> registered users', time: '3 hours ago' },
];

/* ---------- System health ---------- */
export interface HealthService {
  name: string;
  detail: string;
  state: 'operational' | 'degraded' | 'outage';
  days: string;
}

export const healthServices: HealthService[] = [
  { name: 'API gateway', detail: '118 ms p95', state: 'operational', days: 'oooooooooooooooooooooooooooooo' },
  { name: 'Checkout & payments', detail: '214 ms p95', state: 'operational', days: 'oooooooooooowoooooooooooooooo' },
  { name: 'Search index', detail: '640 ms p95 · normally 180 ms', state: 'degraded', days: 'oooooooooooooooooooooooooowooow' },
  { name: 'Media CDN', detail: '42 ms p95', state: 'operational', days: 'oooooooooooooooooooooooooooooo' },
  { name: 'Background jobs', detail: '1.2k queued', state: 'operational', days: 'ooooooooooooooooooooowoooooooo' },
  { name: 'Email delivery', detail: '99.7% delivered', state: 'operational', days: 'ooooooooboooooooooooooooooooooo' },
];

export interface HealthMeter {
  label: string;
  display: string;
  pct: number;
  warn?: boolean;
}

export const healthMeters: HealthMeter[] = [
  { label: 'CPU', display: '42%', pct: 42 },
  { label: 'Memory', display: '61%', pct: 61 },
  { label: 'Database connections', display: '288 / 500', pct: 58 },
  { label: 'Search queue', display: '84%', pct: 84, warn: true },
];

/* ---------- Revenue breakdown ---------- */
export interface RevenueSegment {
  label: string;
  sub: string;
  amount: number;
  pct: number;
  color: string;
}

export const revenueSegments: RevenueSegment[] = [
  { label: 'Commission', sub: '5% average take rate', amount: 280500, pct: 67.9, color: '#4f46e5' },
  { label: 'Subscriptions', sub: 'Seller plans (MRR)', amount: 98400, pct: 23.8, color: '#b45309' },
  { label: 'Featured listings', sub: 'Paid promotions', amount: 33960, pct: 8.2, color: '#0369a1' },
];
