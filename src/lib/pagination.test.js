/**
 * Pagination envelope handling.
 *
 * The backend made pagination mandatory on every list endpoint, so responses
 * became {count, next, previous, results}. Nine Redux slices were assigning
 * that object straight into a state field the UI calls .map() on — which
 * crashes the page rather than degrading. The unwrap has to tolerate BOTH
 * shapes, because a bare array is still what some callers and all the older
 * tests produce.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));

const { unwrapList, unwrapCount, fetchAllPages, MAX_PAGE_SIZE } = await import('./pagination');
const axiosInstance = (await import('@/api/axiosInstance')).default;

describe('unwrapList', () => {
  it('pulls rows out of a paginated envelope', () => {
    expect(unwrapList({ count: 2, next: null, previous: null, results: [{ id: 1 }, { id: 2 }] }))
      .toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('passes a bare array through unchanged', () => {
    expect(unwrapList([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  it.each([[null], [undefined], [{}], ['nonsense'], [{ results: null }]])(
    'returns an array, never a crash, for %j',
    (payload) => {
      expect(Array.isArray(unwrapList(payload))).toBe(true);
    },
  );
});

describe('unwrapCount', () => {
  it('prefers the envelope count over the page length', () => {
    expect(unwrapCount({ count: 137, results: [{}, {}] })).toBe(137);
  });

  it('falls back to the length of a bare array', () => {
    expect(unwrapCount([{}, {}, {}])).toBe(3);
  });
});

describe('fetchAllPages', () => {
  beforeEach(() => { axiosInstance.get.mockReset(); });

  it('walks every page and concatenates the rows', async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ count: 3, next: 'x', results: [{ id: 1 }] })
      .mockResolvedValueOnce({ count: 3, next: 'x', results: [{ id: 2 }] })
      .mockResolvedValueOnce({ count: 3, next: null, results: [{ id: 3 }] });

    await expect(fetchAllPages('/api/catalogs/departments/')).resolves.toEqual([
      { id: 1 }, { id: 2 }, { id: 3 },
    ]);
    expect(axiosInstance.get).toHaveBeenCalledTimes(3);
  });

  it('requests the maximum page size the backend allows', async () => {
    axiosInstance.get.mockResolvedValueOnce({ count: 1, next: null, results: [{ id: 1 }] });
    await fetchAllPages('/api/catalogs/roles/');
    const [, config] = axiosInstance.get.mock.calls[0];
    expect(config.params.page_size).toBe(MAX_PAGE_SIZE);
  });

  it('stops at a hard cap instead of looping forever on a server that always says there is more', async () => {
    // A backend bug that never sets next=null would otherwise hang the tab.
    axiosInstance.get.mockResolvedValue({ count: 99999, next: 'always', results: [{ id: 1 }] });
    const rows = await fetchAllPages('/api/catalogs/types/');
    expect(axiosInstance.get.mock.calls.length).toBeLessThanOrEqual(50);
    expect(rows.length).toBeLessThanOrEqual(50);
  });

  it('returns a single page when the server reports no more', async () => {
    axiosInstance.get.mockResolvedValueOnce({ count: 1, next: null, results: [{ id: 7 }] });
    await expect(fetchAllPages('/x/')).resolves.toEqual([{ id: 7 }]);
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
  });
});
