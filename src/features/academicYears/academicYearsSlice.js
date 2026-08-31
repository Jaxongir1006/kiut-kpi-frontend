import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

export const fetchYears = createAsyncThunk(
  'academicYears/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages('/api/catalogs/years/');
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createYear = createAsyncThunk(
  'academicYears/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post('/api/catalogs/years/', data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateYear = createAsyncThunk(
  'academicYears/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`/api/catalogs/years/${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteYear = createAsyncThunk(
  'academicYears/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/catalogs/years/${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const academicYearsSlice = createSlice({
  name: 'academicYears',
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
      // fetchAll
      .addCase(fetchYears.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchYears.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchYears.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // create
      .addCase(createYear.pending, (state) => { state.isSaving = true; })
      .addCase(createYear.fulfilled, (state, action) => {
        state.isSaving = false;
        state.list.push(action.payload);
      })
      .addCase(createYear.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      // update
      .addCase(updateYear.pending, (state) => { state.isSaving = true; })
      .addCase(updateYear.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((y) => y.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateYear.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      // delete
      .addCase(deleteYear.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteYear.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.list = state.list.filter((y) => y.id !== action.payload);
      })
      .addCase(deleteYear.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export default academicYearsSlice.reducer;
