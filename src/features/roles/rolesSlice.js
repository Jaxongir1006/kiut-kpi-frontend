import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

const BASE = '/users/roles/';

export const fetchRoles = createAsyncThunk(
  'roles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const rolesSlice = createSlice({
  name: 'roles',
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
      .addCase(fetchRoles.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchRoles.fulfilled, (state, action) => { state.isLoading = false; state.list = action.payload; })
      .addCase(fetchRoles.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(createRole.pending, (state) => { state.isSaving = true; })
      .addCase(createRole.fulfilled, (state, action) => { state.isSaving = false; state.list.unshift(action.payload); })
      .addCase(createRole.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(updateRole.pending, (state) => { state.isSaving = true; })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateRole.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(deleteRole.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteRole.fulfilled, (state, action) => { state.isDeleting = false; state.list = state.list.filter((r) => r.id !== action.payload); })
      .addCase(deleteRole.rejected, (state, action) => { state.isDeleting = false; state.error = action.payload; });
  },
});

export default rolesSlice.reducer;
