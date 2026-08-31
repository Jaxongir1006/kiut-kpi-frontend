import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchAllPages } from '@/lib/pagination';

const BASE = '/api/teachers/profiles/';

// Walked to the last page on purpose: useUserRole() resolves the logged-in teacher's
// profile out of this list, and a teacher missing from it cannot submit anything.
export const fetchTeachers = createAsyncThunk(
  'teachers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllPages(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const multipartConfig = { headers: { 'Content-Type': undefined } };

export const createTeacher = createAsyncThunk(
  'teachers/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data, multipartConfig);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateTeacher = createAsyncThunk(
  'teachers/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data, multipartConfig);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteTeacher = createAsyncThunk(
  'teachers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const teachersSlice = createSlice({
  name: 'teachers',
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
      .addCase(fetchTeachers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createTeacher.pending, (state) => { state.isSaving = true; })
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.isSaving = false;
        state.list.unshift(action.payload);
      })
      .addCase(createTeacher.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      .addCase(updateTeacher.pending, (state) => { state.isSaving = true; })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateTeacher.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })
      .addCase(deleteTeacher.pending, (state) => { state.isDeleting = true; })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.list = state.list.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTeacher.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export default teachersSlice.reducer;
