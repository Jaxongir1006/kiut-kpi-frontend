import axiosInstance from '@/api/axiosInstance';

// Backend caps page_size at 200; asking for more silently returns 200.
export const MAX_PAGE_SIZE = 200;

// Hard stop for the page walker. 50 * 200 = 10 000 rows — far above any catalog we own,
// but low enough that a server returning a permanent `next` pointer cannot hang the tab.
const MAX_PAGES = 50;

/**
 * Every list endpoint now answers {count, next, previous, results}, but a few
 * (and older deployments) still answer a bare array. Accept both.
 */
export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

/** Total number of rows on the server, not the number we currently hold. */
export function unwrapCount(payload) {
  if (typeof payload?.count === 'number') return payload.count;
  return unwrapList(payload).length;
}

/**
 * Fetch a single page with the largest allowed page_size.
 * Use this for collections that can grow without bound (submissions, summaries):
 * `count` lets the UI tell the user that more rows exist server-side.
 *
 * @returns {Promise<{items: any[], count: number, hasMore: boolean, raw: any}>}
 */
export async function fetchPagedList(url, params = {}) {
  const payload = await axiosInstance.get(url, {
    params: { page_size: MAX_PAGE_SIZE, ...params },
  });
  const items = unwrapList(payload);
  const count = unwrapCount(payload);
  return { items, count, hasMore: items.length < count, raw: payload };
}

/**
 * Walk `next` until the collection is exhausted and return every row.
 * Only for reference/catalog lists the UI assumes are complete — a teacher whose
 * profile sits on page 2 would otherwise be unable to submit anything.
 *
 * Pages are requested by number rather than by following the absolute `next` URL,
 * so the walk keeps using the configured API base (and its auth interceptor)
 * instead of whatever host the server happens to advertise.
 */
export async function fetchAllPages(url, params = {}) {
  const items = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // Sequential by necessity: `next` is only known after the previous response.
    const payload = await axiosInstance.get(url, {
      params: { ...params, page, page_size: MAX_PAGE_SIZE },
    });

    items.push(...unwrapList(payload));

    // A bare array response has no `next`, so this also terminates un-paginated endpoints.
    if (!payload?.next) return items;
  }

  console.warn(`[pagination] Stopped after ${MAX_PAGES} pages for ${url}; list may be incomplete.`);
  return items;
}
