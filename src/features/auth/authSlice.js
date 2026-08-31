import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { LOGIN_URL, LOGOUT_URL } from '@/api/axiosInstance';

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosInstance.post(LOGIN_URL, { username, password });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      await dispatch(fetchMeThunk());
      return data;
    } catch (err) {
      return rejectWithValue(
        err.detail || err.non_field_errors?.[0] || err.message || 'Login yoki parol noto\'g\'ri'
      );
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const user = await axiosInstance.get('/users/auth/me/');
      return user;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Failed to fetch user');
    }
  }
);

/**
 * Blacklists the refresh token server-side, then drops the local session.
 * Without the server call a stolen refresh token stays valid for its full lifetime.
 */
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  const refresh = localStorage.getItem('refresh_token');
  const access = localStorage.getItem('access_token');

  // Log out locally first and unconditionally: a slow or failing blacklist call
  // must never trap the user inside a logged-in UI.
  dispatch(clearSession());

  if (!refresh) return;

  try {
    // Tokens are already gone from localStorage, so the request interceptor cannot
    // attach the header any more — pass the captured one explicitly.
    await axiosInstance.post(
      LOGOUT_URL,
      { refresh },
      access ? { headers: { Authorization: `Bearer ${access}` } } : undefined
    );
  } catch {
    // Best effort: offline, or the token was already expired/blacklisted.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    // A stored token means App will immediately fetch /me. Starting at false would let the
    // first render happen with user=null and flash the admin shell at a teacher.
    isFetchingMe: !!localStorage.getItem('access_token'),
    error: null,
  },
  reducers: {
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isFetchingMe = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // fetchMe
      .addCase(fetchMeThunk.pending, (state) => {
        state.isFetchingMe = true;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.isFetchingMe = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        state.isFetchingMe = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });
  },
});

export const { clearSession, clearError } = authSlice.actions;
export default authSlice.reducer;
