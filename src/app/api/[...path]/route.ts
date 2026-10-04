import { NextRequest, NextResponse } from 'next/server';
import { buildProxyTarget, normalizeBackendBase } from '@/lib/bff';

/**
 * BFF proxy — same-origin forwarder to the backend API.
 *
 * Why: the browser calls `/api/v1/...` (this route) instead of the backend
 * origin directly. That keeps the httpOnly refresh cookie same-origin so
 * `middleware.ts` can see the session, avoids CORS, and keeps
 * `NEXT_PUBLIC_API_BASE_URL` out of the client bundle for API traffic.
 *
 * Mapping: `/api/v1/<...rest>` → `<backendBase>/<...rest>?<search>`,
 * where backendBase normalises to `http://localhost:4000/api/v1` by default.
 * Only paths under the `/api/` prefix reach here (file location), and only
 * `v1/` is forwarded — anything else gets a 404 so the proxy is not an
 * open relay.
 */

function backendBase(): string {
  return normalizeBackendBase(
    process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  );
}

function rewriteSetCookie(value: string): string {
  // Strip the backend Domain so the cookie lands on the frontend origin.
  // Keep everything else (Path, HttpOnly, SameSite, Max-Age) as issued.
  const parts = value
    .split(';')
    .map((p) => p.trim())
    .filter((p) => !/^domain=/i.test(p));
  const hasPath = parts.some((p) => /^path=/i.test(p));
  if (!hasPath) parts.push('Path=/');
  return parts.join('; ');
}

async function proxy(req: NextRequest, params: { path?: string[] }): Promise<NextResponse> {
  const segments = params.path ?? [];
  // Only v1 API is proxied; everything else 404s (no open relay).
  const target = buildProxyTarget(segments, req.nextUrl.search, backendBase());
  if (!target) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Unknown API path' } },
      { status: 404 },
    );
  }

  const outHeaders = new Headers();
  const passthrough = ['authorization', 'content-type', 'accept', 'accept-language'];
  for (const name of passthrough) {
    const v = req.headers.get(name);
    if (v) outHeaders.set(name, v);
  }
  const cookies = req.headers.get('cookie');
  if (cookies) outHeaders.set('cookie', cookies);
  // Traceability: reuse the client's id or mint one server-side.
  const incomingRid = req.headers.get('x-request-id');
  outHeaders.set(
    'x-request-id',
    incomingRid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  );

  const method = req.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  let body: ArrayBuffer | undefined;
  if (hasBody) {
    try {
      body = await req.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers: outHeaders,
      body: hasBody && body?.byteLength ? body : undefined,
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend unreachable — try again shortly.' },
      },
      { status: 503 },
    );
  }

  const resBody = await upstream.arrayBuffer();
  const res = new NextResponse(resBody, { status: upstream.status });
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.headers.set('content-type', contentType);

  // Forward Set-Cookie(s), re-scoped to this origin.
  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const rawCookies: string[] =
    typeof getSetCookie === 'function'
      ? getSetCookie.call(upstream.headers)
      : (() => {
          const single = upstream.headers.get('set-cookie');
          return single ? [single] : [];
        })();
  for (const c of rawCookies) res.headers.append('set-cookie', rewriteSetCookie(c));

  const upstreamRid = upstream.headers.get('x-request-id') ?? outHeaders.get('x-request-id');
  if (upstreamRid) res.headers.set('x-request-id', upstreamRid);
  return res;
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, await ctx.params);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, await ctx.params);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, await ctx.params);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, await ctx.params);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, await ctx.params);
}
