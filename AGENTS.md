# AGENTS.md — Aurora Admin (e-commerce-frontend)

Next.js 16 App Router + React 19 + TS strict + MUI v9 + Redux Toolkit + RTK Query. Path alias `@/*` → `src/*`.

Priorities, in order: **correctness → security → performance → SEO → UX polish**. Never trade a higher one for a lower one. If a rule below conflicts with the task, say so before deviating.

## Commands (use exactly)

- Dev / build require the webpack flag (scripts already include it — do not run bare `next dev`):
  - `npm run dev` (`next dev --webpack`), `npm run build` (`next build --webpack`), `npm start`
- No typecheck/format scripts exist: `npx tsc --noEmit` for types; no Prettier.
- `npm run lint` (eslint `next/core-web-vitals` + `next/typescript`).
- Tests: `npm test` (silent), single file: `npx jest <path> [--silent]` (e.g. `npx jest src/store/__tests__/authSlice.test.ts`), coverage: `npm run test:coverage`, CI: `npm run test:ci` (`--ci --coverage --maxWorkers=2`).
- Coverage thresholds enforced: branches/functions 40%, lines/statements 50%; collection limited to `src/{lib,store,services,types,components}`.
- Bundle analysis: `ANALYZE=true npm run build` (via `@next/bundle-analyzer`, webpack-compatible). Run it after adding any dependency or heavy screen.
- Definition of done for any change: `npx tsc --noEmit` + `npm run lint` + relevant `npx jest` pass, and (for UI) the Performance + SEO checklists below are verified.

## Env / backend

- Backend base URL comes from `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000/api/v1` in `src/lib/config.ts`). Copy `.env.example` → `.env.local` for local dev. `NEXT_PUBLIC_*` is baked at build time.
- Public site origin comes from `NEXT_PUBLIC_SITE_URL` (used for canonical URLs, sitemap, OG tags). Read it only through `src/lib/config.ts`, never `process.env` inline.
- Image/CDN hostnames are allow-listed in `next.config` `images.remotePatterns` (never the deprecated `images.domains`). Adding a new image host = add a precise pattern (protocol + hostname + pathname), nothing broader.
- All API calls go through `apiClient` (`src/lib/axios.ts`): `baseURL=config.apiBaseUrl`, `withCredentials:true`, 15s timeout, `Bearer` + `x-request-id` headers.

## Auth (do not reinvent)

- Access token lives only in memory (`src/lib/tokenManager.ts`); persistence is a `localStorage` hint key `ecomm-admin-has-session` plus an httpOnly refresh cookie.
- `apiClient` does single-flight 401 → `POST /admin/auth/refresh` → single retry; public auth URLs (`login`, `2fa/`, `forgot-password`, `reset-password`, `refresh`) never refresh. `src/store/authSlice.ts`: `bootstrapSession` (refresh on load if hint exists), `setSession`/`clearAuth`/logout thunks, `AuthStage: password|verify|done`.
- `AuthGuard` (`src/components/auth/AuthGuard.tsx`) wraps everything in `src/app/layout.tsx`. Public prefixes only: `/admin/login`, `/admin/forgot-password`, `/admin/reset-password` (+ subpaths). `?next=` carries post-login redirect (defaults `/admin/dashboard`). Legacy pre-panel paths (`/login`, `/dashboard`, …) are rewritten to `/admin/*` in `middleware.ts` (query + `next` preserved). Next 16 renames this file convention to `proxy.ts`; keep the current name until a deliberate migration, and do not run both.
- Panels: one URL prefix per audience (`src/lib/panels.ts` — admin `/admin` live; seller `/seller` and shopper root reserved). Build cross-page links from those constants, never inline literals.
- RTK Query: empty `api` shell (`src/services/api.ts`) + `axiosBaseQuery` (`src/services/baseQuery.ts`, `{status,data}` error shape). Add features via `injectEndpoints`; existing `tagTypes: ['Sessions']`.

## UI / providers

- Provider order matters (`src/app/providers.tsx`): Redux `Provider` (per-render `makeStore()`) → `AppRouterCacheProvider` → MUI `ThemeProvider` + `CssBaseline`.
- Theme engine (reference look: near-black warm canvas, hairline borders, one indigo-blue accent — the "Onyx" preset). Every palette ships BOTH a `light` and `dark` `ThemeColors`; the console boots in **dark** mode by default. Single source of truth is the mutable `mercatoTokens` in `src/lib/theme.ts` — reuse tokens, never hardcode palette hex. Preset tables (`THEME_PRESETS`, each preset = `{ light, dark }`) live in `src/lib/themePresets.ts` (server-safe: the root layout boot script imports it); the engine + persistence lives in `src/lib/themes.ts` (`activateTheme(presetId, mode, custom)` mutates `mercatoTokens` in place, syncs `:root` CSS vars + the `html.dark` class + `color-scheme`, persists to localStorage keys `aurora-theme-{preset,mode,custom,resolved}` via `STORAGE_KEYS`). `ThemeManagerProvider` (`src/app/providers.tsx`, exposes `useThemeManager()`) rebuilds the MUI theme via `buildAppTheme(tokens, mode)` and exposes `mode`, `setMode()`, `toggleMode()` — the Topbar icon button toggles modes; the manager screen (`/admin/themes` → `themes/_components/ThemesView.tsx`) offers a Light/Dark segmented control plus presets. Custom brand overrides auto-derive `brandSoft`/`brandStrong` toward the ACTIVE canvas (white-tinted in light, near-black-tinted in dark), so one accent hex works in both modes. Status colors (good/bad/info/accent) stay shared across presets but always ship per-mode variants (`statusColorsFor(mode)`) — `*Soft` wells tint toward the canvas, never white, in dark mode. Fonts via `next/font` CSS vars — Inter everywhere (`--font-display`/`--font-body`, both Inter) matching the reference UI's neutral sans; headings inherit it (no separate display family). Styling is Tailwind v4 (`@import "tailwindcss"`) with a class-based `dark:` variant (`@custom-variant dark` in `globals.css`) + MUI overrides; keep `:focus-visible` accent outline and `prefers-reduced-motion` handling in `globals.css`. `:root` compiled CSS fallbacks + the blocking boot script in `layout.tsx` must both encode the Onyx defaults — keep them in lockstep when presets change.
- **Dark-mode correctness:** never assume white canvases. `rgba(255,255,…)` overlays and `#fff` text on `mercatoTokens.text` chips read as white-on-white in dark mode — derive from the theme (e.g. `t.palette.mode` inside `sx` callbacks for translucent chrome, `mercatoTokens.bg` for ink-on-text) or test both modes before delivering.
- Form validation: Zod schemas in `src/lib/validations.ts` (`loginSchema`, `verifySchema`, `forgotPasswordSchema`, `resetPasswordSchema` min 12 chars).
- Layout: route groups `src/app/(auth)` (public) and `src/app/(dashboard)` (guarded shell `AppShell`+`Sidebar`+`Topbar`). Components live in `components/{auth,dashboard,layout,ui}` (`DataLoader`/`FallbackUI`/`Loaders` for async states).
- Shared controls `src/components/ui/controls/` (barrel `index.ts`) — use instead of raw MUI: `FormField` (hint + password toggle), `SelectField`, `DateTimeField` (`mode: date|time|datetime` + ISO helpers), `SearchField` (icon + clear), `Modal` (icon tile + subtitle + actions) for every dialog, `ConfirmDialog` (blast-radius + checkbox/type-to-confirm proofs) for destructive confirms, `TableCard` (title/count, always-visible `toolbar`, `empty` state, `footer`) for every list table. Guide primitives (`GuideAccordion`, `HowRow`, `DetailRow`, `TourDialog`) live in `src/components/ui/Guide.tsx`. Every control ships with tests in `controls/__tests__/`.

## UX bar (assume zero-knowledge users — design defensively)

Every screen must read as a finished SaaS product, not a wireframe. The
design language is **Lark-compact**: a dense, quiet task-console (reference =
Lark Minimize tasks) — plain 17px icons, hairline dividers, filled-capsule
active states, muted blue selection, no icon tiles, no brand-colored chrome.
Before delivering UI, verify all of these:

- **Compact chrome (hard numbers):** app shell = 236px grouped sidebar +
  52px topbar, content `maxWidth: 1360`, `pt: 2.25`. Panels (`MuiPaper`)
  padding 16px, radius 12px (`t.radius.lg`), hairline border, near-flat
  shadow. Buttons 32px tall (`0.82rem`), chips 22px, menu items 32px,
  table cells `10px 12px` (8px small), headings 1.25/0.95/0.88rem. Don't
  re-inflate these in views — the MUI theme in `src/lib/theme.ts` already
  ships them globally.
- **Sidebar discipline:** plain icon + label rows (minHeight 34, icons
  uncased 1.0625rem), uppercase `0.6rem` group labels, active row filled
  with `action.selected` + `text.primary` (not brand tiles). Badges are
  quiet gray pills or solid `primary.main` counts. Scrollbar thumb is
  `lineStrong`, never brand.
- **Density, not air:** settings-style pages use compact headers (`mt: 0.5`,
  `mb` ≤ 2), section `gap: 1.5`, card padding `p: 2`, small buttons
  (`size="small"`) for secondary actions. Never leave a half-empty full-width
  card — split explanation + form into side-by-side grid columns (`5fr/7fr`
  on `lg`, stacked on `xs`). Metric numbers top out around `1.5rem`
  (`letterSpacing -0.02em`); a 2rem stat is a regression.
- **No dead space / orphan widths:** form fields fill their card (3-up grid
  on `sm+` where sensible). Full-width cards must contain full-width content
  (definition rows, grouped chips, tables) — not a single 480px column.
- **Detail everything:** never render bare comma-joined strings. Group and
  label data (e.g. permissions grouped by prefix with counts), show counts in
  chips, format dates, add Status/Role chips, use `DetailRow`-style
  label/value rows with dividers and an explanatory caption.
- **Zero-jargon guidance inline:** every action gets a "What it is" line plus
  a numbered "How it works" (`Accordion` with `StepNum` rows) written for
  someone who has never heard of the feature. State consequences explicitly
  (e.g. "signs you out everywhere", "each code works once").
- **Guided tours are scarce, not default:** add a tour only where the module
  or functionality is genuinely complex for a first-time user (e.g. 2FA
  methods on the Security page). Simple list/table pages (admins, roles,
  activity, sessions) get inline guidance only — never a tour. When a tour
  exists: skippable dialog with MUI `Stepper`, Back/Next/Skip (never a forced
  linear lock-in), ending in a CTA that starts the real flow. Surface tour
  entry points in both the summary strip and each method card.
- **Dialogs teach:** enrollment/confirm dialogs carry their own mini-stepper
  ("Scan code → Save + confirm"), numbered field labels ("Step 1 — save
  codes"), and helper text on every input. Long enrollment content is split
  into stepped screens inside the dialog (Back/Next, never one scrolling
  column — no dialog scrollbar); QR/code dialogs use `maxWidth="sm"`.
  Destructive dialogs state the blast radius first, then ask for proof
  (password + code).
- **Closed helpers look inviting:** collapsed guidance (accordions) reads as a
  tinted helper row (soft brand background, help icon, dark CTA-colored
  label) — never a bare bordered box.
- **Skill first:** run the `ui-ux-pro-max` skill design-system search before
  any UI build/rebuild, and apply its pre-delivery checklist (no emoji icons,
  cursor/hover feedback, contrast, focus states, responsive 375–1440px).

## Architecture (server pages, component-based routes)

- Route `page.tsx` files must stay **server components**: no `use client`,
  export `metadata` (or `generateMetadata`), render the view. All interactivity
  lives in a client component at `<route>/_components/<Name>View.tsx`
  (`'use client'`).
- Push `'use client'` as **low in the tree as possible**. A client boundary
  pulls its whole import subtree into the browser bundle; keep static
  chrome, headings, and copy in server components and pass client islands as
  `children` where it helps. Never mark a layout, provider-free wrapper, or
  purely presentational component `'use client'` without a hook/event reason.
- Think component-first: before writing UI inline, ask "will this be used in
  another module, screen, or dialog?" If yes, put it in
  `components/{auth,dashboard,layout,ui}` (or the route `_components/` if
  single-use). Do NOT pre-build speculative libraries (input fields, date
  pickers, modals, selects) — extract a shared component only at the second
  real use.
- Static variables live in one global file: `src/lib/variables.ts` (grouped
  by route with a header comment). Import from there — never inline preview
  constants in views. Shared pure helpers go to `src/lib/utils.ts` (create it
  at the second use, not before); shared SVG assets go to
  `src/components/ui/svg.tsx`. Single-use helpers stay in the view file.
- Initial-load data fetching stays **client-side via RTK Query** with
  `DataLoader`/`FallbackUI` states: the access token lives only in browser
  memory and the refresh cookie is scoped to the backend domain, so the
  Next.js server has no credentials for authed endpoints. Server pages stream
  the shell and wrap views in `Suspense` — never attempt server-side authed
  fetch.
- **Public (unauthenticated) pages are the exception:** storefront, marketing,
  and any shopper-facing route fetch on the server (RSC `fetch` with explicit
  caching/revalidation, or `generateStaticParams` + ISR) so HTML ships with
  content for crawlers and fast LCP. Never fetch public catalog data in a
  client `useEffect`.
- Folder rule: feature code is colocated by route (`_components/`, `_hooks/`,
  `_lib/`). Cross-route code graduates to `components/` / `lib/` / `services/`
  only at the second use. No circular imports; `lib/` never imports from
  `components/`.
- Types: no `any`; shared API types in `src/types`. Derive form types from Zod
  (`z.infer`). Prefer discriminated unions over boolean flag pairs.

## Performance (non-negotiable defaults)

Targets (p75, mobile, 4G): **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, TTFB ≤ 800ms**. Public pages: first-load route JS ≤ ~170 KB gzip. Admin screens: keep each route's own JS lean; flag anything > 250 KB gzip to the user.

- **Bundle discipline:**
  - Lazy-load anything heavy and not needed for first paint with `next/dynamic` (charts, rich-text/markdown editors, QR/code dialogs, date pickers with big locales, tour dialogs, export/CSV/PDF libs, maps). Use `ssr:false` only inside a client component and only when the library touches `window`.
  - Import by path or named export from tree-shakeable packages (`@mui/icons-material/Search`, not `import * as Icons`). Never import a whole icon set, lodash root, moment, or full date-fns locale lists. Prefer `date-fns`/native `Intl` over moment; native `fetch`/`Intl`/`structuredClone` over libraries.
  - Add a dependency only if nothing in the repo or platform does the job; check its gzip cost first (bundlephobia / analyzer) and mention it in the PR notes.
  - Barrel files (`controls/index.ts`) are fine for small, side-effect-free modules; never create barrels that re-export heavy or client-only code across route boundaries.
- **Rendering:**
  - Stream with `Suspense` + route `loading.tsx` (skeletons matching final layout, so no CLS). Add `error.tsx` and `not-found.tsx` per major route group.
  - Don't block render on non-critical work: defer analytics/third-party scripts with `next/script` `strategy="lazyOnload"` (or `afterInteractive` only when needed). No render-blocking `<script>`/`<link>` in `<head>`.
  - Use `startTransition` / `useDeferredValue` for filter, search, and tab changes that re-render big lists. Debounce search inputs (≈300ms) before hitting the API.
  - Lists/tables over ~100 rendered rows must be paginated (server-side, preferred) or virtualized. Never render unbounded arrays.
  - Stable references: memoize (`useMemo`/`useCallback`/`React.memo`) only where it prevents a measured re-render (large lists, context values, deep props). No blanket memoization. Context values must be memoized; split contexts by change-frequency.
  - Keep Redux state minimal and serializable; server data lives in RTK Query, not in slices. Use selectors (`createSelector`/`selectFromResult`) so components subscribe to the narrowest slice.
  - Animate only `transform`/`opacity`. Honor `prefers-reduced-motion`. No layout-triggering animation.
- **Data/network (RTK Query):**
  - Set sensible `keepUnusedDataFor`, use `skip` for conditional queries, `providesTags`/`invalidatesTags` with granular ids (not blanket tags) so mutations refetch only what changed, and `refetchOnFocus`/`refetchOnReconnect` only where freshness matters.
  - Prefer one aggregated endpoint over N parallel calls for a screen; request only needed fields/page sizes; cancel in-flight requests on unmount (RTK Query does this — don't bypass it with raw axios in components).
  - Optimistic updates for cheap, reversible mutations (toggles, reorder); always roll back on error.
- **Fonts:** only through `next/font` (Inter for both `--font-display` and `--font-body`) with `display: 'swap'`, `subsets: ['latin']`, and only the weights actually used. No `@import` of Google Fonts in CSS; no extra families without approval.
- **CSS:** Tailwind v4 utilities + MUI `sx`/theme; no new global CSS beyond `globals.css`. Avoid large runtime-computed `sx` objects inside hot list rows — hoist static `sx` to module constants.
- **Caching & headers (`next.config`):** `compress: true`, `poweredByHeader: false`, long-lived immutable caching for hashed static assets and `/_next/image` (set `images.minimumCacheTTL` deliberately), and security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`/`X-Frame-Options`). Keep `optimizePackageImports` for MUI and any other large library. Add `<link rel="preconnect">` for the API and image CDN origins in the root layout.
- **React Compiler:** if enabled (`reactCompiler: true`), do not hand-write `useMemo`/`useCallback` for ordinary cases; keep components pure and side-effect free so the compiler can optimize them.
- **Measure, don't guess:** report Lighthouse (mobile) + bundle analyzer deltas for any change that touches a landing/public route or adds a dependency. Wire `useReportWebVitals` to the analytics sink once public pages exist.

## Image handling (zero-jank, minimal bytes)

- **Always `next/image`** — never raw `<img>`, never CSS `background-image` for content images (decorative gradients/SVG excepted). Lint rule `@next/next/no-img-element` stays an error.
- **Always reserve space:** give explicit `width`+`height`, or `fill` inside a parent with a fixed `aspect-ratio`/size and `position: relative`. An image without reserved space is a CLS bug.
- **Always set `sizes`** for responsive/`fill` images (e.g. `sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"`). Never leave the default `100vw` on a grid thumbnail. Use realistic `quality` (default 75; ≤ 80 for photos, higher only for UI art).
- **Formats:** enable `images.formats: ['image/avif', 'image/webp']`. Upload originals at sensible max dimensions (≤ 2400px longest side); never ship a 6 MB original as a thumbnail.
- **LCP image:** exactly one above-the-fold hero/LCP image per page gets `preload` (Next 16; `priority` is deprecated) plus `fetchPriority="high"`. Everything else stays lazy (the default) — never mark below-the-fold images eager.
- **Placeholders:** use `placeholder="blur"` with `blurDataURL` for large photos (static imports get it automatically; remote images need a tiny base64 supplied by the API/CDN), or a skeleton of identical dimensions. No layout shift on load.
- **Remote images:** allow-list via `remotePatterns` only. Prefer images served from the CDN with pre-generated variants (thumb / card / full) and pass the matching variant to the component rather than shrinking a full-size file in the browser. Use `unoptimized` only for already-optimized SVG/animated assets, with a comment why.
- **Avatars, logos, product thumbs, banners:** wrap in a small shared component (`src/components/ui/…`, extracted at the second use) that enforces dimensions, `sizes`, `alt`, fallback (initials/icon) and `onError` handling, so call sites cannot forget them.
- **`alt` text is required**: descriptive for content images, `alt=""` for purely decorative ones. No filename-as-alt.
- **Uploads (admin/seller product images):** validate type and size client-side before upload (allow `jpeg/png/webp/avif`, enforce a max size), show a preview via `URL.createObjectURL` (revoke on cleanup), compress/resize in the browser when the backend does not, send via multipart or pre-signed URL, and show upload progress. Never base64 large images into JSON or Redux state.
- **Galleries/lists of images:** lazy by default, paginate or virtualize long grids, and avoid mounting dozens of full-size images in dialogs.
- **Icons/illustrations:** inline SVG via `src/components/ui/svg.tsx` or MUI icons imported by path; never PNG icons.

## SEO (public routes) and indexing control (private routes)

The admin (`/admin/*`) and seller (`/seller/*`) panels are **private and must never be indexed**; the shopper/public root is where SEO work applies. Do both correctly.

- **Private panels:** export `metadata.robots = { index: false, follow: false }` from the panel's top layout, and also send `X-Robots-Tag: noindex, nofollow` for `/admin/*` and `/seller/*` (via `next.config` `headers()` or the proxy/middleware). Exclude them from the sitemap and disallow them in `robots`.
- **Metadata API only** — no manual `<head>` tags, no `next/head`. Every public `page.tsx` exports `metadata` or `generateMetadata` with: unique `title` (use the root layout `title.template`, e.g. `%s | Brand`), unique `description` (≈120–160 chars), `alternates.canonical` (absolute via `metadataBase`), `openGraph` (title, description, url, siteName, `images` 1200×630, type), and `twitter` (`summary_large_image`). Set `metadataBase` once in the root layout from `NEXT_PUBLIC_SITE_URL`.
- **Dynamic pages** (product, category, store, blog) use `generateMetadata` reading the same cached data as the page (use `React.cache` or Next fetch caching so it is not fetched twice) and `generateStaticParams` + ISR/`revalidate` for popular paths. Return `notFound()` for missing entities so crawlers get a real 404.
- **Crawl files:** `src/app/sitemap.ts` (paginate/split if > 50k URLs; include `lastModified`), `src/app/robots.ts` (allow public, disallow panels/API/cart/checkout/search-with-params, reference the sitemap), and a web manifest. Add `viewport` and `themeColor` through the `viewport` export.
- **Structured data (JSON-LD):** render with a small server component that emits `<script type="application/ld+json">` (escape `<` as `\u003c`). Use `Product` (+ `Offer`, `AggregateRating` only when real review data exists), `BreadcrumbList`, `Organization`, `WebSite` (+ `SearchAction`), `ItemList` for listings. Never mark up data that is not visible on the page.
- **Semantics:** exactly one `<h1>` per page, ordered heading levels, landmark elements (`header`, `nav`, `main`, `footer`), descriptive link text (no "click here"), `<a href>` (via `next/link`) for navigation — never `onClick` + `router.push` for crawlable links. Use `rel="nofollow ugc"` for user-generated links.
- **URLs:** lowercase, hyphenated, stable slugs; one canonical URL per resource; redirect (308) renamed/legacy paths in `next.config` `redirects()`; keep filter/sort/pagination params out of canonicals unless they produce distinct indexable content (use `rel=prev/next`-style linking via real anchors and canonical to the clean list).
- **Core Web Vitals are an SEO ranking input** — everything in Performance and Image handling applies to public routes first. Server-render primary content; never hide indexable content behind client-only tabs/accordions that need JS to mount.
- **i18n (when added):** `alternates.languages` hreflang entries, localized slugs, and `lang` on `<html>`.
- **Accessibility doubles as SEO:** labelled controls, sufficient contrast, visible focus (existing `:focus-visible` rule), keyboard-operable everything, `aria-*` only when native semantics are insufficient.

## Security hygiene (frontend)

- Never put secrets in `NEXT_PUBLIC_*`. Never store tokens in `localStorage` (only the existing non-sensitive session *hint* key). No `dangerouslySetInnerHTML` except sanitized JSON-LD / sanitized rich text (DOMPurify). Validate all user input with Zod; treat API data as untrusted when rendering.
- External links: `rel="noopener noreferrer"` on `target="_blank"`. Validate `?next=` redirects are same-origin relative paths.

## Tests (mock the network, isolate state)

- Jest (`jest.config.js`): jsdom, `ts-jest` with `diagnostics:false` + `strict:false`, module map `@/`→`src/`, CSS/asset mocks in `__mocks__/`.
- `jest.env-setup.js` forces `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:1/api/v1`, `TZ=UTC` before imports; `jest.setup.ts` stubs `matchMedia`/`ResizeObserver`/`IntersectionObserver`/`scrollTo`, stubs `crypto.randomUUID`, clears `localStorage`/`sessionStorage` per test, and makes real `fetch` fail — mock `apiClient`/RTK Query instead (axios bypasses `fetch`, so axios mocks work).
- Component tests must use `renderWithProviders` from `src/test-utils.tsx` (fresh store + real theme per render), never a shared store.
- Pure SEO/perf helpers (metadata builders, JSON-LD builders, sitemap/robots output, image-variant helpers) live in `src/lib` and ship with unit tests, so they stay inside the coverage scope.

## Pre-delivery checklist (run before saying "done")

1. `npx tsc --noEmit`, `npm run lint`, relevant tests green.
2. New client component? Justify the `'use client'`; could it be a server component or a smaller island?
3. New dependency? Checked gzip size, tree-shakeability, and that nothing existing covers it.
4. Heavy/rare UI lazy-loaded with `next/dynamic` and a same-size skeleton.
5. Every image uses `next/image` with reserved space, `sizes`, `alt`; one `preload` max for LCP.
6. Lists paginated/virtualized; search debounced; RTK Query tags granular.
7. Public page: metadata + canonical + OG, JSON-LD where relevant, one `<h1>`, in sitemap. Private page: `noindex` confirmed.
8. No hardcoded palette hex, no inline route literals, no inline preview constants.
9. Responsive 375–1440px, keyboard + focus states, `prefers-reduced-motion` respected.