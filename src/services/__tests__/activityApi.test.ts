import { makeStore } from '@/store';
import { activityApi } from '@/services/activityApi';
import { apiClient } from '@/lib/axios';

jest.mock('@/lib/axios', () => ({
  apiClient: { request: jest.fn() },
}));

const mockedRequest = apiClient.request as jest.Mock;

function entry(overrides = {}) {
  return {
    id: 'cm3x7k9q20001s8n2abcd1234',
    timestamp: '2026-09-21T14:02:00.000Z',
    action: 'admin.roles_updated',
    actionLabel: 'Roles assigned',
    category: 'Admins',
    actor: { id: '1', email: 'aisha@mercato.com', name: 'Aisha Rahman' },
    resource: { type: 'admin', id: '2', label: 'ines@mercato.com' },
    ip: '84.121.9.40',
    userAgent: null,
    changes: [{ field: 'roles', before: 'Sub-Admin', after: 'Sub-Admin, Support' }],
    requestId: 'req-123',
    ...overrides,
  };
}

describe('activityApi (audit-trail queries)', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('listActivity sends page-based params with backend defaults', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [entry()],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });
    const store = makeStore();
    const res = await store.dispatch(
      activityApi.endpoints.listActivity.initiate({ page: 2, q: 'aisha' }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/activity',
      method: 'GET',
      data: undefined,
      params: {
        page: 2,
        limit: 20,
        action: undefined,
        q: 'aisha',
        actor: undefined,
        from: undefined,
        to: undefined,
        sort: undefined,
      },
    });
    expect((res.data as { pagination: { total: number } }).pagination.total).toBe(1);
    store.dispatch(activityApi.util.resetApiState());
  });

  it('listActivity forwards repeatable action keys + UTC day bounds', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });
    const store = makeStore();
    await store.dispatch(
      activityApi.endpoints.listActivity.initiate({
        action: ['role.permissions_updated', 'role.permissions_granted'],
        from: '2026-09-01',
        to: '2026-09-30',
        sort: 'oldest',
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/admin/activity',
        params: expect.objectContaining({
          action: ['role.permissions_updated', 'role.permissions_granted'],
          from: '2026-09-01',
          to: '2026-09-30',
          sort: 'oldest',
        }),
      }),
    );
    store.dispatch(activityApi.util.resetApiState());
  });

  it('activityActions excludes the action filter (counts describe other filters)', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          { action: 'admin.created', label: 'Admin created', category: 'Admins', count: 4 },
        ],
      },
    });
    const store = makeStore();
    const res = await store.dispatch(
      activityApi.endpoints.activityActions.initiate({ q: 'aisha', from: '2026-09-01' }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/activity/actions',
      method: 'GET',
      data: undefined,
      params: { q: 'aisha', actor: undefined, from: '2026-09-01', to: undefined },
    });
    expect((res.data as { data: unknown[] }).data).toHaveLength(1);
    store.dispatch(activityApi.util.resetApiState());
  });

  it('activityDetail fetches a single entry by id', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { success: true, data: entry() } });
    const store = makeStore();
    const res = await store.dispatch(
      activityApi.endpoints.activityDetail.initiate('cm3x7k9q20001s8n2abcd1234'),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/activity/cm3x7k9q20001s8n2abcd1234',
      method: 'GET',
      data: undefined,
      params: undefined,
    });
    expect((res.data as { data: { id: string } }).data.id).toBe(
      'cm3x7k9q20001s8n2abcd1234',
    );
    store.dispatch(activityApi.util.resetApiState());
  });

  it('surfaces backend 400s (bad sort / from-after-to) as query errors', async () => {
    mockedRequest.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'BAD_REQUEST', message: 'from must not be after to' },
        },
      },
    });
    const store = makeStore();
    const res = await store.dispatch(
      activityApi.endpoints.listActivity.initiate({ from: '2026-09-30', to: '2026-09-01' }),
    );
    expect(res.error).toEqual({
      status: 400,
      data: {
        success: false,
        error: { code: 'BAD_REQUEST', message: 'from must not be after to' },
      },
    });
    store.dispatch(activityApi.util.resetApiState());
  });
});
