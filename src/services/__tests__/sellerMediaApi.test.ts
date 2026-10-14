import { makeStore } from '@/store';
import { apiClient } from '@/lib/axios';
import { formatBytes, sellerMediaApi } from '@/services/sellerMediaApi';

jest.mock('@/lib/axios', () => ({
  apiClient: { request: jest.fn(), get: jest.fn() },
}));

const mockedRequest = apiClient.request as jest.Mock;

function asset(overrides = {}) {
  return {
    id: 'cm3x7k9q20001s8n2abcd1234',
    storeId: 'store-1',
    fileName: 'kurta.png',
    originalName: 'kurta.png',
    mime: 'image/png',
    sizeBytes: 68234,
    checksum: 'abc123',
    kind: 'IMAGE',
    visibility: 'PUBLIC',
    status: 'READY',
    storageKey: 'public/stores/store-1/kurta.png',
    url: '/uploads/public/stores/store-1/kurta.png',
    width: null,
    height: null,
    altText: 'Red kurta',
    caption: null,
    folder: 'products',
    tags: ['festive'],
    usageCount: 0,
    createdAt: '2026-10-14T10:00:00.000Z',
    updatedAt: '2026-10-14T10:00:00.000Z',
    ...overrides,
  };
}

describe('sellerMediaApi (catalog media library)', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('sellerMedia sends store-scoped list params', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [asset()],
        pagination: { page: 1, limit: 24, total: 1, totalPages: 1 },
      },
    });
    const store = makeStore();
    const res = await store.dispatch(
      sellerMediaApi.endpoints.sellerMedia.initiate({
        storeId: 'store-1',
        page: 1,
        limit: 24,
        search: 'kurta',
        kind: 'IMAGE',
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/seller/catalog/store-1/media',
      method: 'GET',
      data: undefined,
      params: { page: 1, limit: 24, search: 'kurta', kind: 'IMAGE', folder: undefined, visibility: undefined, orphanOnly: undefined },
    });
    expect((res.data as { pagination: { total: number } }).pagination.total).toBe(1);
    store.dispatch(sellerMediaApi.util.resetApiState());
  });

  it('sellerMediaQuota + update + delete hit store-scoped routes', async () => {
    mockedRequest
      .mockResolvedValueOnce({ data: { success: true, data: { usedBytes: 100, limitBytes: 1000, percent: 10, assetCount: 1 } } })
      .mockResolvedValueOnce({ data: { success: true, data: asset({ caption: 'New' }) } })
      .mockResolvedValueOnce({ data: { success: true, data: { id: asset().id } } });
    const store = makeStore();
    await store.dispatch(sellerMediaApi.endpoints.sellerMediaQuota.initiate('store-1'));
    await store.dispatch(
      sellerMediaApi.endpoints.sellerUpdateMedia.initiate({
        storeId: 'store-1',
        id: asset().id,
        body: { caption: 'New' },
      }),
    );
    await store.dispatch(
      sellerMediaApi.endpoints.sellerDeleteMedia.initiate({ storeId: 'store-1', id: asset().id }),
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(1, {
      url: '/seller/catalog/store-1/media/quota',
      method: 'GET',
      data: undefined,
      params: undefined,
    });
    expect(mockedRequest).toHaveBeenNthCalledWith(2, {
      url: `/seller/catalog/store-1/media/${asset().id}`,
      method: 'PATCH',
      data: { caption: 'New' },
      params: undefined,
    });
    expect(mockedRequest).toHaveBeenNthCalledWith(3, {
      url: `/seller/catalog/store-1/media/${asset().id}`,
      method: 'DELETE',
      data: undefined,
      params: undefined,
    });
    store.dispatch(sellerMediaApi.util.resetApiState());
  });

  it('formatBytes renders human sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
