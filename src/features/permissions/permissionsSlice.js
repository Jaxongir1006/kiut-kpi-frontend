import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

const BASE = '/users/permissions/';

export const fetchPermissions = createAsyncThunk(
  'permissions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createPermission = createAsyncThunk(
  'permissions/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updatePermission = createAsyncThunk(
  'permissions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deletePermission = createAsyncThunk(
  'permissions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState: {
    list: [],
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPermissions.fulfilled, (state, action) => { state.isLoading = false; state.list = action.payload; })
      .addCase(fetchPermissions.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(createPermission.pending, (state) => { state.isSaving = true; })
      .addCase(createPermission.fulfilled, (state, action) => { state.isSaving = false; state.list.push(action.payload); })
      .addCase(createPermission.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(updatePermission.pending, (state) => { state.isSaving = true; })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((p) => p.codename === action.payload.codename);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updatePermission.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(deletePermission.pending, (state) => { state.isDeleting = true; })
      .addCase(deletePermission.fulfilled, (state, action) => { state.isDeleting = false; state.list = state.list.filter((p) => p.id !== action.payload); })
      .addCase(deletePermission.rejected, (state, action) => { state.isDeleting = false; state.error = action.payload; });
  },
});

export default permissionsSlice.reducer;
