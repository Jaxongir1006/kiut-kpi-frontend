import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

const BASE = '/api/catalogs/categories/';

export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
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
      .addCase(fetchCategories.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.isLoading = false; state.list = action.payload; })
      .addCase(fetchCategories.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(createCategory.pending, (state) => { state.isSaving = true; })
      .addCase(createCategory.fulfilled, (state, action) => { state.isSaving = false; state.list.unshift(action.payload); })
      .addCase(createCategory.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(updateCategory.pending, (state) => { state.isSaving = true; })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateCategory.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(deleteCategory.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteCategory.fulfilled, (state, action) => { state.isDeleting = false; state.list = state.list.filter((c) => c.id !== action.payload); })
      .addCase(deleteCategory.rejected, (state, action) => { state.isDeleting = false; state.error = action.payload; });
  },
});

export default categoriesSlice.reducer;
