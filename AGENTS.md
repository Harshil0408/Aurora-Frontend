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

## Tests (mock the network, isolate state)

- Jest (`jest.config.js`): jsdom, `ts-jest` with `diagnostics:false` + `strict:false`, module map `@/`→`src/`, CSS/asset mocks in `__mocks__/`.
- `jest.env-setup.js` forces `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:1/api/v1`, `TZ=UTC` before imports; `jest.setup.ts` stubs `matchMedia`/`ResizeObserver`/`IntersectionObserver`/`scrollTo`, stubs `crypto.randomUUID`, clears `localStorage`/`sessionStorage` per test, and makes real `fetch` fail — mock `apiClient`/RTK Query instead (axios bypasses `fetch`, so axios mocks work).
- Component tests must use `renderWithProviders` from `src/test-utils.tsx` (fresh store + real theme per render), never a shared store.
