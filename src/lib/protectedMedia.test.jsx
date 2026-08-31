/**
 * Authenticated media delivery.
 *
 * The event under test: proof documents and staff photos moved behind
 * authorization on the backend, so a plain <img src> or <a href> now returns
 * 401 — the browser sends no Authorization header on those. Every such file has
 * to be fetched with the bearer token and handed to the DOM as a blob: URL.
 *
 * The assertion that matters most is revocation. A blob: URL pins the whole
 * file in memory until it is revoked, and these are 10 MB PDFs rendered one per
 * row in admin tables. Leaking them is an out-of-memory tab, not a lint nit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/api/axiosInstance', () => ({ default: { get: vi.fn() } }));

const axiosInstance = (await import('@/api/axiosInstance')).default;
const { useProtectedMedia, fetchProtectedMedia } = await import('./protectedMedia');

const blobResponse = (body = 'pdf-bytes') => ({
  data: new Blob([body], { type: 'application/pdf' }),
  headers: { 'content-disposition': 'attachment; filename="certificate.pdf"' },
});

beforeEach(() => {
  axiosInstance.get.mockReset();
  URL.createObjectURL = vi.fn(() => `blob:mock-${Math.random().toString(36).slice(2, 8)}`);
  URL.revokeObjectURL = vi.fn();
});

describe('fetchProtectedMedia', () => {
  it('makes no request at all for a null or empty url', async () => {
    await expect(fetchProtectedMedia(null)).resolves.toBeNull();
    await expect(fetchProtectedMedia(undefined)).resolves.toBeNull();
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it('refuses a non-http(s) url instead of fetching it', async () => {
    // The same scheme allowlist as href rendering: a stored `javascript:` value
    // must not reach the network layer either.
    await expect(fetchProtectedMedia('javascript:alert(1)')).rejects.toBeTruthy();
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it('requests the file as a blob so the bearer token is attached by the interceptor', async () => {
    axiosInstance.get.mockResolvedValueOnce(blobResponse());
    const result = await fetchProtectedMedia('https://api-kpi.duckdns.org/media/proofs/3/x.pdf');

    const [, config] = axiosInstance.get.mock.calls[0];
    expect(config.responseType).toBe('blob');
    expect(result.objectUrl).toMatch(/^blob:/);
  });
});

describe('useProtectedMedia', () => {
  it('resolves a blob url for the requested file', async () => {
    axiosInstance.get.mockResolvedValueOnce(blobResponse());

    const { result } = renderHook(() => useProtectedMedia('https://api-kpi.duckdns.org/media/x.pdf'));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.url).toMatch(/^blob:/);
    expect(result.current.error).toBeNull();
  });

  it('REVOKES the blob url on unmount', async () => {
    axiosInstance.get.mockResolvedValueOnce(blobResponse());

    const { result, unmount } = renderHook(() =>
      useProtectedMedia('https://api-kpi.duckdns.org/media/x.pdf'),
    );
    await waitFor(() => expect(result.current.url).toBeTruthy());
    const created = result.current.url;

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(created);
  });

  it('revokes the previous blob url when the url changes', async () => {
    axiosInstance.get.mockResolvedValue(blobResponse());

    const { result, rerender } = renderHook(({ u }) => useProtectedMedia(u), {
      initialProps: { u: 'https://api-kpi.duckdns.org/media/a.pdf' },
    });
    await waitFor(() => expect(result.current.url).toBeTruthy());
    const first = result.current.url;

    rerender({ u: 'https://api-kpi.duckdns.org/media/b.pdf' });
    await waitFor(() => expect(result.current.url).not.toBe(first));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first);
  });

  it('does not fetch, and reports nothing, when there is no url', () => {
    const { result } = renderHook(() => useProtectedMedia(null));

    expect(axiosInstance.get).not.toHaveBeenCalled();
    expect(result.current).toEqual({ url: null, isLoading: false, error: null });
  });

  it('surfaces a failure rather than spinning forever', async () => {
    axiosInstance.get.mockRejectedValueOnce({ status: 404, message: 'Not found' });

    const { result } = renderHook(() => useProtectedMedia('https://api-kpi.duckdns.org/media/gone.pdf'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.url).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
});
