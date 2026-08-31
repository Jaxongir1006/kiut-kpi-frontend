/**
 * Token refresh, and what an error object is allowed to carry.
 *
 * Two events under test.
 *
 * SINGLE-FLIGHT. SIMPLE_JWT runs with ROTATE_REFRESH_TOKENS and
 * BLACKLIST_AFTER_ROTATION, so every successful refresh invalidates the token
 * it was called with. A dashboard that fires six list requests at once, all of
 * which 401 together, must therefore produce exactly ONE refresh: six would
 * each blacklist a sibling's freshly rotated token and log the user out — the
 * precise bug this replaced.
 *
 * ERROR SHAPE. The raw axios error carries config.headers.Authorization. Any
 * future telemetry that logs a caught value verbatim would ship the user's
 * bearer token to a third party, so it must not escape this module.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';

// Every axios instance inherits defaults AT CREATION, so installing the mock
// adapter here — before the module under test is imported — captures both the
// main instance and the interceptor-free refresh client, which is not exported.
let routes;
let calls;

axios.defaults.adapter = async (config) => {
  const url = config.url || '';
  calls.push({ url, method: config.method, headers: config.headers });
  const handler = Object.entries(routes).find(([path]) => url.includes(path))?.[1];
  const result = handler ? await handler(config) : { status: 404, data: {} };
  const response = { ...result, config, headers: {}, data: result.data ?? {} };
  if (result.status >= 200 && result.status < 300) return response;
  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject(Object.assign(new Error(`Request failed with status ${result.status}`), {
    response, config, isAxiosError: true, request: {},
  }));
};

const { default: axiosInstance, refreshAccessToken } = await import('./axiosInstance');

beforeEach(() => {
  routes = {};
  calls = [];
  localStorage.setItem('access_token', 'OLD_ACCESS');
  localStorage.setItem('refresh_token', 'OLD_REFRESH');
  // jsdom refuses real navigation; handleSessionExpired assigns location.href.
  delete window.location;
  window.location = { pathname: '/dashboard', href: '' };
});

afterEach(() => { vi.restoreAllMocks(); });

const refreshCallCount = () => calls.filter((c) => c.url.includes('/auth/refresh/')).length;

describe('single-flight refresh', () => {
  it('makes ONE refresh call for many simultaneous 401s, then retries them all', async () => {
    let accessAccepted = 'NEW_ACCESS';
    routes = {
      '/auth/refresh/': async () => ({ status: 200, data: { access: 'NEW_ACCESS', refresh: 'NEW_REFRESH' } }),
      '/api/list/': async (config) =>
        config.headers.Authorization === `Bearer ${accessAccepted}`
          ? { status: 200, data: { count: 0, results: [] } }
          : { status: 401, data: { detail: 'expired' } },
    };

    const results = await Promise.all([
      axiosInstance.get('/api/list/a'),
      axiosInstance.get('/api/list/b'),
      axiosInstance.get('/api/list/c'),
    ]);

    expect(refreshCallCount()).toBe(1);
    results.forEach((r) => expect(r).toEqual({ count: 0, results: [] }));
    expect(accessAccepted).toBe('NEW_ACCESS');
  });

  it('stores BOTH rotated tokens, not just the access token', async () => {
    routes = {
      '/auth/refresh/': async () => ({ status: 200, data: { access: 'A2', refresh: 'R2' } }),
      '/api/list/': async (config) =>
        config.headers.Authorization === 'Bearer A2'
          ? { status: 200, data: {} }
          : { status: 401, data: {} },
    };

    await axiosInstance.get('/api/list/');

    expect(localStorage.getItem('access_token')).toBe('A2');
    // Keeping the old refresh token would make the NEXT refresh present a
    // blacklisted token, logging the user out an hour later for no visible reason.
    expect(localStorage.getItem('refresh_token')).toBe('R2');
  });

  it('does not refresh, retry, or log out on a 401 from the login form', async () => {
    routes = { '/users/auth/login/': async () => ({ status: 401, data: { detail: 'No active account' } }) };

    await expect(
      axiosInstance.post('/users/auth/login/', { username: 'x', password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401, detail: 'No active account' });

    expect(refreshCallCount()).toBe(0);
    // A wrong password must not destroy an existing session.
    expect(localStorage.getItem('access_token')).toBe('OLD_ACCESS');
  });

  it('clears the session only once the refresh itself has failed', async () => {
    routes = {
      '/auth/refresh/': async () => ({ status: 401, data: { detail: 'blacklisted' } }),
      '/api/list/': async () => ({ status: 401, data: {} }),
    };

    await expect(axiosInstance.get('/api/list/')).rejects.toBeTruthy();

    expect(refreshCallCount()).toBe(1);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('refuses to refresh when no refresh token is stored', async () => {
    localStorage.removeItem('refresh_token');
    await expect(refreshAccessToken()).rejects.toThrow(/No refresh token/i);
    expect(refreshCallCount()).toBe(0);
  });
});

describe('error sanitisation', () => {
  it('never lets the bearer token escape in a rejected error', async () => {
    routes = { '/api/boom/': async () => ({ status: 500, data: { detail: 'server error' } }) };

    const err = await axiosInstance.get('/api/boom/').catch((e) => e);

    expect(JSON.stringify(err)).not.toContain('Bearer');
    expect(JSON.stringify(err)).not.toContain('OLD_ACCESS');
    expect(err).not.toHaveProperty('config');
    expect(err).not.toHaveProperty('request');
  });

  it('keeps the DRF fields callers already read', async () => {
    routes = { '/api/boom/': async () => ({ status: 400, data: { detail: 'Bad', non_field_errors: ['nope'] } }) };

    const err = await axiosInstance.get('/api/boom/').catch((e) => e);

    expect(err.status).toBe(400);
    expect(err.detail).toBe('Bad');
    expect(err.non_field_errors).toEqual(['nope']);
    expect(err.message).toBe('Bad');
  });
});
