import { makeStore } from '@/store';
import { apiClient } from '@/lib/axios';
import { categoriesApi } from '@/services/categoriesApi';
import { sellerCategoriesApi } from '@/services/sellerCategoriesApi';

jest.mock('@/lib/axios', () => ({
  apiClient: { request: jest.fn() },
}));

const mockedRequest = apiClient.request as jest.Mock;

function node(overrides = {}) {
  return {
    id: 'cat-1',
    parentId: null,
    name: 'Fashion',
    slug: 'fashion',
    description: null,
    imageUrl: null,
    bannerUrl: null,
    icon: null,
    displayOrder: 0,
    status: 'ACTIVE',
    showInNav: true,
    showOnHomepage: false,
    restricted: false,
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
    ogImageUrl: null,
    attributeSetId: null,
    taxClassId: null,
    commissionRateBps: null,
    returnWindowDays: null,
    childCount: 0,
    leaf: true,
    breadcrumb: 'Fashion',
    children: [],
    ...overrides,
  };
}

describe('categoriesApi + sellerCategoriesApi', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('categoryTree + createCategory hit admin routes', async () => {
    mockedRequest
      .mockResolvedValueOnce({ data: { success: true, data: [node()] } })
      .mockResolvedValueOnce({ data: { success: true, data: node() } });
    const store = makeStore();
    await store.dispatch(categoriesApi.endpoints.categoryTree.initiate());
    await store.dispatch(
      categoriesApi.endpoints.createCategory.initiate({ name: 'Fashion' }),
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(1, {
      url: '/admin/categories/tree',
      method: 'GET',
      data: undefined,
      params: undefined,
    });
    expect(mockedRequest).toHaveBeenNthCalledWith(2, {
      url: '/admin/categories',
      method: 'POST',
      data: { name: 'Fashion' },
      params: undefined,
    });
    store.dispatch(categoriesApi.util.resetApiState());
  });

  it('importCategories posts validate/commit modes', async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { creates: 2, updates: 0, errors: [], committed: false } },
    });
    const store = makeStore();
    const res = await store.dispatch(
      categoriesApi.endpoints.importCategories.initiate({
        mode: 'validate',
        rows: [{ name: 'Electronics' }],
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/admin/categories/import',
      method: 'POST',
      data: { mode: 'validate', rows: [{ name: 'Electronics' }] },
      params: undefined,
    });
    expect((res.data as { data: { creates: number } }).data.creates).toBe(2);
    store.dispatch(categoriesApi.util.resetApiState());
  });

  it('seller tree + request + access hit store-scoped routes', async () => {
    mockedRequest
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: { id: 'req-1' } } })
      .mockResolvedValueOnce({ data: { success: true, data: { id: 'acc-1' } } });
    const store = makeStore();
    await store.dispatch(sellerCategoriesApi.endpoints.sellerCategoryTree.initiate('store-1'));
    await store.dispatch(
      sellerCategoriesApi.endpoints.sellerRequestCategory.initiate({
        storeId: 'store-1',
        name: 'Ayurveda',
        justification: 'growing demand here',
      }),
    );
    await store.dispatch(
      sellerCategoriesApi.endpoints.sellerApplyCategoryAccess.initiate({
        storeId: 'store-1',
        categoryId: 'cat-9',
        documentAssetIds: ['doc-1'],
      }),
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(1, {
      url: '/seller/catalog/store-1/categories/tree',
      method: 'GET',
      data: undefined,
      params: undefined,
    });
    expect(mockedRequest).toHaveBeenNthCalledWith(2, {
      url: '/seller/catalog/store-1/categories/requests',
      method: 'POST',
      data: { name: 'Ayurveda', justification: 'growing demand here' },
      params: undefined,
    });
    expect(mockedRequest).toHaveBeenNthCalledWith(3, {
      url: '/seller/catalog/store-1/categories/cat-9/access',
      method: 'POST',
      data: { documentAssetIds: ['doc-1'] },
      params: undefined,
    });
    store.dispatch(sellerCategoriesApi.util.resetApiState());
  });
});
