import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages('/api/catalogs/departments/');
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post('/api/catalogs/departments/', data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`/api/catalogs/departments/${id}/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/catalogs/departments/${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const departmentsSlice = createSlice({
  name: 'departments',
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
      .addCase(fetchDepartments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // create
      .addCase(createDepartment.pending, (state) => { state.isSaving = true; })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.isSaving = false;
        state.list.push(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      // update
      .addCase(updateDepartment.pending, (state) => { state.isSaving = true; })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      // delete
      .addCase(deleteDepartment.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.list = state.list.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export default departmentsSlice.reducer;
