import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

const BASE = '/api/catalogs/degrees/';

export const fetchDegrees = createAsyncThunk(
  'degrees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createDegree = createAsyncThunk(
  'degrees/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateDegree = createAsyncThunk(
  'degrees/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteDegree = createAsyncThunk(
  'degrees/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const degreesSlice = createSlice({
  name: 'degrees',
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
      .addCase(fetchDegrees.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchDegrees.fulfilled, (state, action) => { state.isLoading = false; state.list = action.payload; })
      .addCase(fetchDegrees.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(createDegree.pending, (state) => { state.isSaving = true; })
      .addCase(createDegree.fulfilled, (state, action) => { state.isSaving = false; state.list.unshift(action.payload); })
      .addCase(createDegree.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(updateDegree.pending, (state) => { state.isSaving = true; })
      .addCase(updateDegree.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateDegree.rejected, (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(deleteDegree.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteDegree.fulfilled, (state, action) => { state.isDeleting = false; state.list = state.list.filter((d) => d.id !== action.payload); })
      .addCase(deleteDegree.rejected, (state, action) => { state.isDeleting = false; state.error = action.payload; });
  },
});

export default degreesSlice.reducer;
