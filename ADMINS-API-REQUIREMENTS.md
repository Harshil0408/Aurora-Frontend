# Admins Screen (`/admins`) — Backend API Requirements

Source reviewed: `src/app/(dashboard)/admins/page.tsx` (server wrapper) +
`src/app/(dashboard)/admins/_components/AdminsView.tsx` (client view, 529 lines) +
statics in `src/lib/variables.ts` (`ADMINS`, `ALL_ROLES`, `VIEWER_IS_SUPER_ADMIN`,
`statusTone`, `tabs`) + existing API layer (`src/services/api.ts`,
`src/services/baseQuery.ts`, `src/services/authApi.ts`, `src/lib/axios.ts`,
`src/types/api.ts`, `src/types/auth.ts`).

## 1. Current state (why it is not functional)

| UI piece | Current implementation | Problem |
|---|---|---|
| List + summary strip | `ADMINS: SampleAdmin[]` (5 hardcoded rows) | No fetch; counts (`Total / Active / Needs attention / 2FA`) are derived locally |
| Status tabs | `tabs = ['All','Active','Suspended','Disabled']`, counts computed client-side | Needs server counts per status |
| Search + role filter | `query` filters `a.email` only, `roleFilter` filters loaded array (`SearchField` placeholder literally says "Search loaded page…") | Needs server-side search + filter |
| Pagination footer | Hardcoded "Showing 1–5 of 8", buttons disabled, subtitle "showing page 1 of 2" | No `page/limit/total/totalPages` |
| Row menu → View details | Reads `selected` object + hardcoded "Recent activity" string | No `GET by id`, no real activity |
| Row menu → Change status | Local `RadioGroup`, `confirm()` only fires a `Snackbar` "preview" toast | No mutation, no reason persistence |
| Row menu → Manage roles | Local `roleSelection` state, diff (`added`/`removed`) computed locally | No mutation, role list is `ALL_ROLES` string constant |
| Row menu → Revoke sessions | `ConfirmDialog` → preview toast | No backend call (note: `DELETE /admin/auth/sessions/:id` exists but is for **own** sessions from the Sessions page — this needs an **admin-targeted** variant) |
| Create Admin dialog | 2-step stepper, `defaultValue="new-admin@mercato.com"`, hardcoded "already in use" error, role `Chip`s hardcoded to `['Sub-Admin','Finance']` selected | No `POST`, no email-uniqueness check, no password generator, `VIEWER_IS_SUPER_ADMIN = true` constant instead of real gating |
| Self / safety guards | `a.you`, `lastSuperAdmin`, `lockedOwnSA`, `gatedSA` flags are static fields | Backend must tell the UI who is "you" and who is the last active Super Admin |

**Net: the whole screen is preview/mock. Zero RTK Query endpoints are wired to it.**

## 2. Conventions the backend must follow

Already established by the auth module — reuse, do not invent new ones:

- Base URL: `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000/api/v1` in `src/lib/config.ts`). All paths below are relative to it, e.g. `GET /admin/admins` → `http://localhost:4000/api/v1/admin/admins`.
- Transport: `apiClient` (`src/lib/axios.ts`) — `withCredentials: true` (httpOnly refresh cookie), `Bearer <accessToken>` header, `x-request-id` header, 15s timeout, single-flight 401 → `POST /admin/auth/refresh` → single retry.
- RTK layer: new endpoints go in a new `src/services/adminsApi.ts` via `api.injectEndpoints` + `axiosBaseQuery` (`{status, data}` error shape). Add tagTypes `Admins`, `AdminSummary`, `AdminDetail`, `Roles` alongside existing `['Sessions','Me']`.
- Envelopes (`src/types/api.ts`):
  ```ts
  // single: { success: true, data: T }
  // list:   { success: true, data: T[], pagination: { page, limit, total, totalPages } }
  // error:  { success: false, error: { code, message, details?, requestId? } }
  ```
  `code` ∈ `BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | UNPROCESSABLE | RATE_LIMITED | INTERNAL_ERROR | SERVICE_UNAVAILABLE`.
- Auth on every endpoint below: Bearer required. `403 FORBIDDEN` with `details.requiredPerm` when the caller lacks the permission (see §4).

## 3. APIs required (7 new + 2 existing/dependency)

### 3.1 `GET /admin/admins` — list (CORE, replaces `ADMINS` + tabs + filters + footer)

Query params (all optional, server is source of truth):

| Param | Type | Notes |
|---|---|---|
| `page` | int, default 1 | 1-indexed |
| `limit` | int, default 20, max 100 | Drives footer "Showing x–y of z" |
| `status` | `Active \| Suspended \| Disabled` | Absent = all (the "All" tab). Needed for per-tab counts — either return `meta.counts` here or use §3.2 |
| `role` | string (role key, e.g. `finance`) | Replaces `roleFilter`. `ALL_ROLES` display names today are `Super Admin, Sub-Admin, Support, Finance` — backend should own canonical `key` ↔ `name` mapping (see §3.7) |
| `search` | string | **Must search email + name** server-side (today only `email.includes(query)` client-side). Debounced ~300ms, min 2 chars before sending |
| `sort` | e.g. `createdAt:desc`, `email:asc` | Table has Created column; default `createdAt:desc` |

Response `ApiPaginated<AdminListItem>`:

```ts
interface AdminListItem {
  id: string;                    // missing today (rows keyed by email) — REQUIRED
  email: string;
  name: string;
  status: 'Active' | 'Suspended' | 'Disabled';
  roles: Array<{ key: string; name: string }>; // today string[] — object form needed for filter + chips
  twoFactor: { enabled: boolean; methods: Array<'totp' | 'email_otp'> };
  // today single `tfa: boolean` — methods needed for "Enabled / Not set" dot + summary "x/y 2FA"
  createdAt: string;             // ISO-8601 (today "Mar 2023" display string — backend sends ISO, frontend formats)
  lastLoginAt: string | null;
  isSelf: boolean;               // replaces static `you?: boolean` (compare to `sub` claim / `GET /admin/auth/me`)
  isLastActiveSuperAdmin: boolean; // replaces static `lastSuperAdmin?: boolean`
}
```

Pagination object as in `ApiPaginated`. Recommend also `meta: { counts: { total, active, suspended, disabled } }` so tabs render counts without 4 extra calls.

### 3.2 `GET /admin/admins/summary` — team strip (or fold into 3.1 `meta`)

Today: `Total admins / Active / Needs attention (= suspended+disabled) / 2FA enabled (tfaOn/len)`. Either endpoint is fine, but the UI needs one call that returns:

```ts
{ total: number; active: number; suspended: number; disabled: number;
  needsAttention: number; twoFactorEnabled: number; }
```

If omitted, the frontend will derive it from 3.1 `meta.counts` + a `tfaEnabled` count — confirm which the backend will provide.

### 3.3 `GET /admin/admins/:id` — details dialog (replaces `dialog === 'details'`)

Response `ApiSuccess<AdminDetail>` = `AdminListItem` plus:

```ts
interface AdminDetail extends AdminListItem {
  updatedAt: string;
  activeSessionsCount: number;
  recentActivity: Array<{
    id: string;
    action: string;      // e.g. "Roles assigned"
    actorEmail: string;  // e.g. "aisha@mercato.com"
    ipAddress: string | null;
    createdAt: string;   // ISO
  }>; // replaces hardcoded "Roles assigned by Aisha … Sep 18 — Signed in from 84.121.9.40 · Sep 21"
}
```

Limit to last ~5 entries. Full history lives on the Activity page (`GET /admin/activity?resourceType=admin&resourceId=:id` — out of scope here, but keep the filter keys consistent).

### 3.4 `POST /admin/admins` — Create Admin dialog (step 1 account + step 2 roles)

Request:

```ts
{
  email: string;          // lowercase, trim, unique — today hardcoded "already in use" error must become real 409
  name: string;           // MISSING from dialog today — add "Full name" field; backend requires min 2 chars
  tempPassword: string;   // min 12 chars (same rule as `resetPasswordSchema` in `src/lib/validations.ts`); weak → 422
  roleKeys: string[];     // min 1 (dialog enforces "at least one"); keys from §3.7, NOT display names
}
```

Behaviors:

- `409 CONFLICT { code: 'EMAIL_IN_USE' }` when the email exists (drives the inline `FormField error` state).
- `403 FORBIDDEN` when `roleKeys` contains `super-admin` and caller is not Super Admin (today's `VIEWER_IS_SUPER_ADMIN` gating + "Signed in as Super Admin…" hint must be driven by `GET /admin/auth/me` roles/permissions).
- Never return the password. Response:
  ```ts
  { id: string; email: string; status: 'Active'; roles: { key: string; name: string }[]; inviteSent: boolean; createdAt: string; }
  ```
- Side effects: create audit entry (`Admin created`, actor, IP, `changes: [{ field: 'roles', before: '—', after: 'Finance' }]` — matches `LOGS` shape in variables.ts), optionally send invite email (`inviteSent` flag tells UI what toast to show).
- Frontend `invalidatesTags: ['Admins','AdminSummary']`, closes stepper, shows real toast.

### 3.5 `PATCH /admin/admins/:id/status` — Change status dialog

Request: `{ status: 'Active' | 'Suspended' | 'Disabled'; reason: string }` (`reason` required, min ~3 chars — shown in Activity Log; today a free `FormField multiline`).

Rules (all currently fake, must be enforced server-side):

| Transition | Effect |
|---|---|
| → `Suspended` | Blocks sign-in immediately, **holds** sessions (reversible) |
| → `Disabled` | Blocks sign-in immediately, **revokes all sessions** for that admin |
| → `Active` | Re-allows sign-in |
| Self-change (`:id` == caller) | `403 FORBIDDEN { code: 'CANNOT_CHANGE_OWN_STATUS' }` (today: menu item disabled with "disabled — your own row" title) |
| Last active Super Admin → non-Active | `409 CONFLICT { code: 'LAST_SUPER_ADMIN' }` → UI shows the existing "Blocked: last Super Admin / Manage roles instead" alert variant |
| Any change | Audit entry (`Status changed`, `changes: [{ field:'status', before, after }, { field:'reason', before:'—', after }]`), `reason` visible in Activity Log |

Response: `ApiSuccess<{ id: string; status: AdminStatus; updatedAt: string }>`. Invalidates `Admins`, `AdminDetail`, `AdminSummary`.

### 3.6 `PUT /admin/admins/:id/roles` — Manage roles dialog

Request: `{ roleKeys: string[] }` (min 1 → else `422`; unknown key → `422 { details.invalidKeys }`).

Rules:

- Own `super-admin` grant is locked: removing it from self → `403 { code: 'CANNOT_REMOVE_OWN_SUPER_ADMIN' }` (today `lockedOwnSA` checkbox disabled).
- Granting `super-admin` without being Super Admin → `403 { code: 'SUPER_ADMIN_GRANT_FORBIDDEN' }` (today `gatedSA`).
- Last-active-Super-Admin guard: if the edit would leave zero active Super Admins → `409 { code: 'LAST_SUPER_ADMIN' }`.
- Response should echo the diff the dialog already previews: `{ roles: {key,name}[]; added: string[]; removed: string[] }`.
- Audit entry (`Roles assigned`, role before/after). Invalidates `Admins`, `AdminDetail`. Note: if `:id` is self and roles changed, backend should also rotate/refresh permission claims — frontend will refetch `GET /admin/auth/me` (`providesTags: ['Me']`).

### 3.7 `POST /admin/admins/:id/revoke-sessions` — Revoke sessions confirm

The `ConfirmDialog` copy ("signed out everywhere, immediately … account itself is untouched") maps to:

- Revoke **all refresh-token families / sessions** for `:id`. Response `{ revokedCount: number }`.
- `403` unless caller has `sessions.revoke`; callers can revoke others with `admins.suspend`/`sessions.revoke` — backend to confirm exact perm (recommend `sessions.revoke`).
- Self-revoke (`:id` == caller) must behave like existing `POST /admin/auth/logout-all`: clear httpOnly cookie + frontend `clearAuth()` + redirect to `/login`. Cross-admin revoke must NOT touch the caller's cookie.
- Audit entry (`Sessions revoked`). Invalidates `AdminDetail` (session count).

> Existing `DELETE /admin/auth/sessions/:id` + `useSessionsQuery` stay as-is for the **Sessions page (own sessions)**. Do not overload them for admin-targeted revocation.

### 3.8 Dependencies (no new build, but required at runtime)

- `GET /admin/auth/me` (exists, `MeResponse { id, email, status, twoFactor, roles, permissions, createdAt }`) — drives `VIEWER_IS_SUPER_ADMIN` (check `roles includes 'super-admin'` or `permissions includes 'roles.assign'`), the `YOU` chip + self-action locks (`isSelf` cross-check), and topbar chip. No change needed unless role keys diverge from `ALL_ROLES` display names.
- `GET /admin/roles` (owned by the **Roles screen**, currently `INITIAL_ROLES`/`INITIAL_GRANTS` statics) — the Admins screen needs it to replace `ALL_ROLES: string[]` with `{ key, name, description, system?, memberCount? }`. Response `ApiSuccess<Role[]>`; keep `key` stable (`super-admin`, `sub-admin`, …) since `PUT …/roles` and `?role=` filter speak keys.

### 3.9 Nice-to-have (small, high UX value)

- `POST /admin/admins/password/generate` → `{ password: string }` (12+ chars, server-accepted policy) for the dialog's "Generate" button. Otherwise generate client-side with `crypto.getRandomValues` — but then weak-password `422` surprises disappear only if the policy is documented.
- `GET /admin/admins/check-email?email=` → `{ available: boolean }` for live "already in use" validation on step 1 (else rely on `POST` 409).
- `GET /admin/activity?resourceType=admin&resourceId=:id&limit=5` canonical form of the "Recent activity" box, consistent with `LogEntry { id, timestamp, action, actionType, resource, actor, ip, changes[] }`.

## 4. Permission matrix (map to existing `PERM_GROUPS` keys)

| Endpoint | Required perm | Why |
|---|---|---|
| `GET /admin/admins`, `GET /admin/admins/summary`, `GET /admin/admins/:id` | `admins.view` | "View — list and inspect admin accounts" |
| `POST /admin/admins` | `admins.create` | "Invite new admin accounts" |
| `PATCH …/status`, `PUT …/roles` | `admins.edit` + `roles.assign` (roles), `admins.suspend` (suspend/disable) | Matches `Admins: View/Create/Edit/Suspend` + `Roles: Assign` groups |
| `POST …/revoke-sessions` | `sessions.revoke` | "Revoke one or all sessions" |
| Granting `super-admin` | caller must hold `super-admin` role (beyond perms) | Today's SA-only gate |

Frontend hides/disables affordances on missing perms (menu items, Create button, SA checkbox) AND backend enforces with `403 + details.requiredPerm`.

## 5. Validation & error contract (field-level, for `FormField`/`ConfirmDialog` display)

- Email: RFC-valid, lowercase, trim; duplicate → `409 EMAIL_IN_USE` (not generic 400).
- `tempPassword` / any password: min 12 chars (align with `resetPasswordSchema`), reject common/weak → `422` with `details: { field: 'tempPassword', reason: 'TOO_WEAK' }`.
- `roleKeys`: non-empty, all known → `422 { field: 'roleKeys' }` otherwise.
- `reason` (status change): required 3–500 chars → `422 { field: 'reason' }`.
- `:id` unknown → `404 ADMIN_NOT_FOUND`.
- All errors use the `ApiErrorBody` envelope + `requestId` (surfaced via `normaliseApiError`), so toasts can show "message · #requestId".

## 6. Audit logging (required for the Activity page to stay truthful)

Every mutating call (§3.4–3.7) must append an entry readable as today's `LogEntry`:

```ts
{ action: 'Admin created' | 'Status changed' | 'Roles assigned' | 'Sessions revoked',
  resource: <target email>, actor: <caller email>, ip: <caller ip>,
  changes: [{ field, before, after }] }
```

`reason` from §3.5 must appear as a `reason` change row.

## 7. Frontend integration checklist (after backend lands)

1. New `src/services/adminsApi.ts` (`listAdmins`, `adminSummary`, `adminDetail`, `createAdmin`, `updateStatus`, `updateRoles`, `revokeAdminSessions` + `listRoles` import or shared `rolesApi`).
2. Delete `ADMINS`/`ALL_ROLES`/`VIEWER_IS_SUPER_ADMIN` usage from `AdminsView`; wire `DataLoader` (skeleton — already stubbed via `loadingPreview`) + `FallbackUI` + `normaliseApiError` (pattern already used in `SessionsView`).
3. Move tab counts, search, role filter, pagination to server query args (debounce search, reset `page` on filter change); enable footer buttons with real `pagination`.
4. Show `isSelf` chip + disable self status/role-lock from `me` + `isSelf`, not constants; handle `LAST_SUPER_ADMIN` 409 with the existing blocked-variant alert.
5. `POST` success → invalidate `Admins`/`AdminSummary`, close dialogs, replace all "(preview)" toasts with real messages + request IDs.

## 8. Minimal backend delivery order

1. `GET /admin/admins` (+ `meta.counts`) + `GET /admin/admins/:id` → list + details work.
2. `POST /admin/admins` + `PATCH …/status` + `PUT …/roles` → all dialogs work.
3. `POST …/revoke-sessions` + `GET /admin/roles` canonical keys → safety + filters correct.
4. `GET …/summary` (if not folded into 1) + audit wiring + generate/check-email helpers → polish.
