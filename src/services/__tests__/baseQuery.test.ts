import { axiosBaseQuery } from '@/services/baseQuery';
import { apiClient } from '@/lib/axios';

jest.mock('@/lib/axios', () => ({
  apiClient: { request: jest.fn() },
}));

const mockedRequest = apiClient.request as jest.Mock;

describe('axiosBaseQuery (RTK Query bridge)', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('returns data on success', async () => {
    mockedRequest.mockResolvedValueOnce({ data: { success: true, data: 1 } });
    const q = axiosBaseQuery();
    const out = await q(
      { url: '/x', method: 'GET' },
      {} as never,
      {} as never,
    );
    expect(out).toEqual({ data: { success: true, data: 1 } });
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/x',
      method: 'GET',
      data: undefined,
      params: undefined,
    });
  });

  it('normalises axios errors to { status, data } (never throws)', async () => {
    mockedRequest.mockRejectedValueOnce({
      response: { status: 404, data: { success: false } },
    });
    const q = axiosBaseQuery();
    const out = await q(
      { url: '/missing' },
      {} as never,
      {} as never,
    );
    expect(out).toEqual({
      error: { status: 404, data: { success: false } },
    });
  });

  it('defaults to 500 when no response (network down)', async () => {
    mockedRequest.mockRejectedValueOnce(new Error('down'));
    const q = axiosBaseQuery();
    const out = await q({ url: '/x' }, {} as never, {} as never);
    expect(out).toEqual({
      error: { status: 500, data: { success: false } },
    });
  });
});
