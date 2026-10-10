import { makeStore } from '@/store';
import { attributesApi } from '@/services/attributesApi';
import { apiClient } from '@/lib/axios';

jest.mock('@/lib/axios', () => ({
  apiClient: { request: jest.fn() },
}));

const mockedRequest = apiClient.request as jest.Mock;

function row(overrides = {}) {
  return {
    id: 'cm3x7k9q20001s8n2abcd1234',
    type: 'payment_type',
    key: 'upi',
    label: 'UPI',
    value: null,
    description: null,
    metadata: null,
    sortOrder: 0,
    status: 'ACTIVE',
    isSystem: false,
    createdAt: '2026-01-04T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('attributesApi (lookup-catalog endpoints)', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('attributeTypes hits GET /admin/attributes/types', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: [{ type: 'payment_type', count: 4 }] },
    });
    const store = makeStore();
    const res = await store.dispatch(attributesApi.endpoints.attributeTypes.initiate());
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/attributes/types',
      method: 'GET',
      data: undefined,
      params: undefined,
    });
    expect((res.data as { data: unknown[] }).data).toHaveLength(1);
    store.dispatch(attributesApi.util.resetApiState());
  });

  it('listAttributes sends page-based params with backend defaults', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [row()],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });
    const store = makeStore();
    await store.dispatch(
      attributesApi.endpoints.listAttributes.initiate({ type: 'category', status: 'ACTIVE', search: 'fash' }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/attributes',
      method: 'GET',
      data: undefined,
      params: { page: 1, limit: 20, type: 'category', status: 'ACTIVE', search: 'fash' },
    });
    store.dispatch(attributesApi.util.resetApiState());
  });

  it('createAttribute posts the new entry', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { success: true, data: row() } });
    const store = makeStore();
    await store.dispatch(
      attributesApi.endpoints.createAttribute.initiate({ type: 'country', key: 'in', label: 'India' }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/attributes',
      method: 'POST',
      data: { type: 'country', key: 'in', label: 'India' },
      params: undefined,
    });
    store.dispatch(attributesApi.util.resetApiState());
  });

  it('updateAttribute patches without type/key', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { success: true, data: row({ label: 'UPI 2' }) } });
    const store = makeStore();
    await store.dispatch(
      attributesApi.endpoints.updateAttribute.initiate({ id: 'abc', label: 'UPI 2', value: null }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/attributes/abc',
      method: 'PATCH',
      data: { label: 'UPI 2', value: null },
      params: undefined,
    });
    store.dispatch(attributesApi.util.resetApiState());
  });

  it('setAttributeStatus patches status with a reason', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { success: true, data: row({ status: 'INACTIVE' }) } });
    const store = makeStore();
    await store.dispatch(
      attributesApi.endpoints.setAttributeStatus.initiate({ id: 'abc', status: 'INACTIVE', reason: 'sunset' }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/attributes/abc/status',
      method: 'PATCH',
      data: { status: 'INACTIVE', reason: 'sunset' },
      params: undefined,
    });
    store.dispatch(attributesApi.util.resetApiState());
  });

  it('deleteAttribute hits DELETE /admin/attributes/:id', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { success: true, data: { deleted: true } } });
    const store = makeStore();
    await store.dispatch(attributesApi.endpoints.deleteAttribute.initiate('abc'));
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/attributes/abc',
      method: 'DELETE',
      data: undefined,
      params: undefined,
    });
    store.dispatch(attributesApi.util.resetApiState());
  });
});
