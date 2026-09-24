import { normaliseApiError } from '@/types/api';

describe('normaliseApiError (generic, leak-free errors for UX)', () => {
  it('maps a backend error body to a safe shape', () => {
    const out = normaliseApiError({
      status: 401,
      data: {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bad token',
          requestId: 'req-1',
        },
      },
    });
    expect(out).toEqual({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Bad token',
      requestId: 'req-1',
      details: undefined,
    });
  });

  it('falls back safely for null / primitives / malformed shapes', () => {
    for (const bad of [null, undefined, 42, 'boom', {}, { status: 403 }]) {
      const out = normaliseApiError(bad);
      expect(out.status).toBe(
        (bad as { status?: number })?.status ?? 500,
      );
      expect(out.code).toBe('INTERNAL_ERROR');
      expect(out.message).toBeDefined();
    }
  });

  it('never throws on hostile details payloads', () => {
    const out = normaliseApiError({
      status: 400,
      data: {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: '<img src=x onerror=alert(1)>',
          details: { nested: ['<script>alert(1)</script>'] },
        },
      },
    });
    // Passed through as data only — React escapes on render, never executed
    expect(out.code).toBe('BAD_REQUEST');
    expect(typeof out.message).toBe('string');
  });
});
