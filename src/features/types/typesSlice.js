import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

const BASE = '/api/catalogs/types/';

export const fetchTypes = createAsyncThunk(
  'types/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createType = createAsyncThunk(
  'types/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateType = createAsyncThunk(
  'types/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteType = createAsyncThunk(
  'types/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const typesSlice = createSlice({
  name: 'types',
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
      .addCase(fetchTypes.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTypes.fulfilled, (state, action) => { state.isLoading = false; state.list = action.payload; })
      .addCase(fetchTypes.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(createType.pending, (state) => { state.isSaving = true; })
      .addCase(createType.fulfilled, (state, action) => { state.isSaving = false; state.list.unshift(action.payload); })
      .addCase(createType.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(updateType.pending, (state) => { state.isSaving = true; })
      .addCase(updateType.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateType.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(deleteType.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteType.fulfilled, (state, action) => { state.isDeleting = false; state.list = state.list.filter((t) => t.id !== action.payload); })
      .addCase(deleteType.rejected, (state, action) => { state.isDeleting = false; state.error = action.payload; });
  },
});

export default typesSlice.reducer;
