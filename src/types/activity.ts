/**
 * Activity-log domain types — mirror of the backend contract
 * (backend: /api/v1/admin/activity{,/actions,/:id}).
 *
 * Snapshot rule: `actor` and `resource` are denormalized at write time —
 * render them verbatim, never resolve names client-side.
 * Display-string rule: `changes[].before/after` arrive pre-formatted
 * ('—' when empty); render verbatim, never string-split.
 */

export interface ActivityActor {
  /** Admin id at write time ('' when system-initiated). */
  id: string;
  /** Snapshot ('system' when no actor, 'unknown' for pre-snapshot rows). */
  email: string;
  /** Snapshot display name (falls back to email). */
  name: string;
}

export interface ActivityResource {
  /** 'admin' | 'role' | 'permission' | 'session' (anything else → generic). */
  type: string;
  /** Target id/key (admin id, role key, permission key…). */
  id: string;
  /** Snapshot label at write time (email, role name, …). */
  label: string;
}

export interface ActivityChange {
  /** Machine field, e.g. 'status', 'roles', 'permissions'. */
  field: string;
  /** Display string; '—' when there was no previous value. */
  before: string;
  /** Display string. */
  after: string;
}

export interface ActivityEntry {
  id: string;
  /** ISO 8601 UTC — format client-side, never string-split. */
  timestamp: string;
  /** Stable machine key, e.g. 'role.permissions_updated'. */
  action: string;
  /** Human label, e.g. 'Role updated'. */
  actionLabel: string;
  /** Group for the filter dropdown, e.g. 'Roles'. */
  category: string;
  /** Write-time snapshot — survives later renames. */
  actor: ActivityActor;
  /** Write-time snapshot — survives renames/deletes. */
  resource: ActivityResource;
  /** Actor IP ('' when not captured). */
  ip: string;
  /** Populated for entries written after this API shipped. */
  userAgent?: string | null;
  /** Before/after diff; [] means "no field changes". */
  changes: ActivityChange[];
  /** Links log row ↔ request logs (render under errors, bug reports). */
  requestId: string;
}

export interface ActionOption {
  /** Machine key (value sent back as ?action=). */
  action: string;
  /** Human label for the dropdown. */
  label: string;
  category: string;
  /** Entries matching the *other* active filters. */
  count: number;
}

export type ActivitySort = 'newest' | 'oldest';

export interface ListActivityArgs {
  page?: number;
  limit?: number;
  /** Exact feed key(s); repeatable on the wire (OR). */
  action?: string | string[];
  /** Case-insensitive substring over actor/resource/IP/action. */
  q?: string;
  /** Exact actor email or id ("everything X did"). */
  actor?: string;
  /** YYYY-MM-DD, inclusive, start of day UTC. */
  from?: string;
  /** YYYY-MM-DD, inclusive, end of day UTC. */
  to?: string;
  sort?: ActivitySort;
}

export interface ActivityActionsArgs {
  q?: string;
  actor?: string;
  from?: string;
  to?: string;
}
