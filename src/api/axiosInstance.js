import axios from 'axios';

const LOGIN_URL = '/users/auth/login/';
const REFRESH_URL = '/users/auth/refresh/';
const LOGOUT_URL = '/users/auth/logout/';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bare client for the refresh call itself: it must never go through the
// interceptors below, or a failing refresh would recurse into another refresh.
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const isAuthEndpoint = (url = '') =>
  url.includes(LOGIN_URL) || url.includes(REFRESH_URL) || url.includes(LOGOUT_URL);

/**
 * Strip everything except the parts a caller may legitimately need.
 * The raw axios error carries `config.headers.Authorization` (the bearer token)
 * and `request`, so it must never escape this module into logs or telemetry.
 *
 * The response body is spread on top-level too, because callers across the app
 * read DRF fields directly (`err.detail`, `err.non_field_errors`).
 */
function sanitizeError(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data ?? null;
  const isBodyObject = !!data && typeof data === 'object' && !Array.isArray(data);

  const message =
    (isBodyObject && typeof data.detail === 'string' && data.detail) ||
    (isBodyObject && typeof data.message === 'string' && data.message) ||
    error?.message ||
    'Tarmoq xatosi';

  return { ...(isBodyObject ? data : null), status, data, message };
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

/** Called only once the refresh path has definitively failed. */
function handleSessionExpired() {
  const hadToken = !!localStorage.getItem('access_token');
  clearTokens();

  const skipPaths = ['/login', '/public-rating'];
  if (!skipPaths.includes(window.location.pathname)) {
    // Sessiya muddati o'tgan yoki avtorizatsiyasiz — public sahifaga yo'naltirish
    window.location.href = hadToken ? '/login' : '/public-rating';
  }
}

let refreshPromise = null;

async function requestNewTokens() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error('No refresh token stored');

  const { data } = await refreshClient.post(REFRESH_URL, { refresh });
  if (!data?.access) throw new Error('Refresh response contained no access token');

  localStorage.setItem('access_token', data.access);
  // ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION are on: the refresh token we just
  // sent is dead. Dropping the returned one would make the *next* refresh use a
  // blacklisted token and log the user out anyway.
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);

  return data.access;
}

/**
 * Single-flight refresh: N requests failing with 401 at the same time share one
 * network call. Firing one refresh per request would blacklist the rotated
 * tokens of its own siblings and log the user out.
 */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestNewTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(sanitizeError(error))
);

axiosInstance.interceptors.response.use(
  // Callers get the body directly. `returnFullResponse` opts out, for the few
  // places that need headers too (protected media needs Content-Disposition).
  (response) => (response.config?.returnFullResponse ? response : response.data),
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (status !== 401 || !original) {
      return Promise.reject(sanitizeError(error));
    }

    // A 401 from login means "wrong password" — there is no session to refresh
    // or to expire, so let the form show the error untouched.
    if (isAuthEndpoint(original.url || '')) {
      return Promise.reject(sanitizeError(error));
    }

    if (original.retriedAfterRefresh) {
      handleSessionExpired();
      return Promise.reject(sanitizeError(error));
    }

    original.retriedAfterRefresh = true;

    try {
      await refreshAccessToken();
      // Re-running the request re-runs the request interceptor above, which reads
      // the freshly stored access token.
      return await axiosInstance(original);
    } catch {
      handleSessionExpired();
      // Report the original 401; the refresh failure is an implementation detail.
      return Promise.reject(sanitizeError(error));
    }
  }
);

export { LOGIN_URL, REFRESH_URL, LOGOUT_URL };
export default axiosInstance;
