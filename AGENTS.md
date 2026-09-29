# AGENTS.md — Aurora Admin (e-commerce-frontend)

Next.js 16 App Router + React 19 + TS strict + MUI v9 + Redux Toolkit + RTK Query. Path alias `@/*` → `src/*`.

## Commands (use exactly)

- Dev / build require the webpack flag (scripts already include it — do not run bare `next dev`):
  - `npm run dev` (`next dev --webpack`), `npm run build` (`next build --webpack`), `npm start`
- No typecheck/format scripts exist: `npx tsc --noEmit` for types; no Prettier.
- `npm run lint` (eslint `next/core-web-vitals` + `next/typescript`).
- Tests: `npm test` (silent), single file: `npx jest <path> [--silent]` (e.g. `npx jest src/store/__tests__/authSlice.test.ts`), coverage: `npm run test:coverage`, CI: `npm run test:ci` (`--ci --coverage --maxWorkers=2`).
- Coverage thresholds enforced: branches/functions 40%, lines/statements 50%; collection limited to `src/{lib,store,services,types,components}`.

## Env / backend

- Backend base URL comes from `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000/api/v1` in `src/lib/config.ts`). Copy `.env.example` → `.env.local` for local dev. `NEXT_PUBLIC_*` is baked at build time.
- All API calls go through `apiClient` (`src/lib/axios.ts`): `baseURL=config.apiBaseUrl`, `withCredentials:true`, 15s timeout, `Bearer` + `x-request-id` headers.

## Auth (do not reinvent)

- Access token lives only in memory (`src/lib/tokenManager.ts`); persistence is a `localStorage` hint key `ecomm-admin-has-session` plus an httpOnly refresh cookie.
- `apiClient` does single-flight 401 → `POST /admin/auth/refresh` → single retry; public auth URLs (`login`, `2fa/`, `forgot-password`, `reset-password`, `refresh`) never refresh. `src/store/authSlice.ts`: `bootstrapSession` (refresh on load if hint exists), `setSession`/`clearAuth`/logout thunks, `AuthStage: password|verify|done`.
- `AuthGuard` (`src/components/auth/AuthGuard.tsx`) wraps everything in `src/app/layout.tsx`. Public prefixes only: `/login`, `/forgot-password`, `/reset-password` (+ subpaths). `?next=` carries post-login redirect (defaults `/dashboard`).
- RTK Query: empty `api` shell (`src/services/api.ts`) + `axiosBaseQuery` (`src/services/baseQuery.ts`, `{status,data}` error shape). Add features via `injectEndpoints`; existing `tagTypes: ['Sessions']`.

## UI / providers

- Provider order matters (`src/app/providers.tsx`): Redux `Provider` (per-render `makeStore()`) → `AppRouterCacheProvider` → MUI `ThemeProvider` + `CssBaseline`.
- Theme is light-only; single source of truth is `mercatoTokens` in `src/lib/theme.ts` — reuse tokens, never hardcode palette hex. Fonts via `next/font` CSS vars (`--font-display` Sora, `--font-body` Manrope). Styling is Tailwind v4 (`@import "tailwindcss"`) + MUI overrides; keep `:focus-visible` accent outline and `prefers-reduced-motion` handling in `globals.css`.
- Form validation: Zod schemas in `src/lib/validations.ts` (`loginSchema`, `verifySchema`, `forgotPasswordSchema`, `resetPasswordSchema` min 12 chars).
- Layout: route groups `src/app/(auth)` (public) and `src/app/(dashboard)` (guarded shell `AppShell`+`Sidebar`+`Topbar`). Components live in `components/{auth,dashboard,layout,ui}` (`DataLoader`/`FallbackUI`/`Loaders` for async states).
- Shared controls `src/components/ui/controls/` (barrel `index.ts`) — use instead of raw MUI: `FormField` (hint + password toggle), `SelectField`, `DateTimeField` (`mode: date|time|datetime` + ISO helpers), `SearchField` (icon + clear), `Modal` (icon tile + subtitle + actions) for every dialog, `ConfirmDialog` (blast-radius + checkbox/type-to-confirm proofs) for destructive confirms, `TableCard` (title/count, always-visible `toolbar`, `empty` state, `footer`) for every list table. Guide primitives (`GuideAccordion`, `HowRow`, `DetailRow`, `TourDialog`) live in `src/components/ui/Guide.tsx`. Every control ships with tests in `controls/__tests__/.

## UX bar (assume zero-knowledge users — design defensively)

Every screen must read as a finished SaaS product, not a wireframe. Before
delivering UI, verify all of these:

- **Density, not air:** settings-style pages use compact headers (`mt: 0.5`,
  `mb` ≤ 2), section `gap: 1.5`, card padding `p: 2`, small buttons
  (`size="small"`) for secondary actions. Never leave a half-empty full-width
  card — split explanation + form into side-by-side grid columns (`5fr/7fr`
  on `lg`, stacked on `xs`).
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
  export `metadata`, render the view. All interactivity lives in a client
  component at `<route>/_components/<Name>View.tsx` (`'use client'`).
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

## Tests (mock the network, isolate state)

- Jest (`jest.config.js`): jsdom, `ts-jest` with `diagnostics:false` + `strict:false`, module map `@/`→`src/`, CSS/asset mocks in `__mocks__/`.
- `jest.env-setup.js` forces `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:1/api/v1`, `TZ=UTC` before imports; `jest.setup.ts` stubs `matchMedia`/`ResizeObserver`/`IntersectionObserver`/`scrollTo`, stubs `crypto.randomUUID`, clears `localStorage`/`sessionStorage` per test, and makes real `fetch` fail — mock `apiClient`/RTK Query instead (axios bypasses `fetch`, so axios mocks work).
- Component tests must use `renderWithProviders` from `src/test-utils.tsx` (fresh store + real theme per render), never a shared store.
