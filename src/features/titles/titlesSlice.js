import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

const BASE = '/api/catalogs/titles/';

export const fetchTitles = createAsyncThunk(
  'titles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createTitle = createAsyncThunk(
  'titles/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateTitle = createAsyncThunk(
  'titles/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteTitle = createAsyncThunk(
  'titles/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const titlesSlice = createSlice({
  name: 'titles',
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
      .addCase(fetchTitles.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTitles.fulfilled, (state, action) => { state.isLoading = false; state.list = action.payload; })
      .addCase(fetchTitles.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(createTitle.pending, (state) => { state.isSaving = true; })
      .addCase(createTitle.fulfilled, (state, action) => { state.isSaving = false; state.list.unshift(action.payload); })
      .addCase(createTitle.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(updateTitle.pending, (state) => { state.isSaving = true; })
      .addCase(updateTitle.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateTitle.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(deleteTitle.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteTitle.fulfilled, (state, action) => { state.isDeleting = false; state.list = state.list.filter((t) => t.id !== action.payload); })
      .addCase(deleteTitle.rejected, (state, action) => { state.isDeleting = false; state.error = action.payload; });
  },
});

export default titlesSlice.reducer;
