// @ts-nocheck
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchPagedList } from '@/lib/pagination';

const BASE = '/api/activities/submissions/';
const multipartConfig = { headers: { 'Content-Type': undefined } };

// Unbounded collection (every activity of every teacher): one max-size page rather than a
// full walk. `count` is exposed so the UI can warn that older rows are not loaded.
export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPagedList(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const createSubmission = createAsyncThunk(
  'submissions/create',
  async (data, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, data, multipartConfig);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const updateSubmission = createAsyncThunk(
  'submissions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.patch(`${BASE}${id}/`, data, multipartConfig);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

// 1-bosqich: Kafedra mudiri tekshiruvi → POST /submissions/<id>/department-review/
// status: "department_approved" | "department_rejected"
export const departmentReview = createAsyncThunk(
  'submissions/departmentReview',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(`${BASE}${id}/department-review/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

// 2-bosqich: Ilmiy bo'lim (Komissiya) tekshiruvi → POST /submissions/<id>/review/
// status: "approved" | "rejected" | "overridden"
export const reviewSubmission = createAsyncThunk(
  'submissions/review',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(`${BASE}${id}/review/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const deleteSubmission = createAsyncThunk(
  'submissions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${BASE}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

function upsert(list, payload) {
  const idx = list.findIndex((s) => s.id === payload.id);
  if (idx !== -1) list[idx] = payload;
  else list.unshift(payload);
}

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: {
    list: [],
    count: 0,
    hasMore: false,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload.items;
        state.count = action.payload.count;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchSubmissions.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(createSubmission.pending,   (state) => { state.isSaving = true; })
      .addCase(createSubmission.fulfilled, (state, action) => { state.isSaving = false; state.list.unshift(action.payload); })
      .addCase(createSubmission.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(updateSubmission.pending,   (state) => { state.isSaving = true; })
      .addCase(updateSubmission.fulfilled, (state, action) => { state.isSaving = false; upsert(state.list, action.payload); })
      .addCase(updateSubmission.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(departmentReview.pending,   (state) => { state.isSaving = true; })
      .addCase(departmentReview.fulfilled, (state, action) => { state.isSaving = false; upsert(state.list, action.payload); })
      .addCase(departmentReview.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(reviewSubmission.pending,   (state) => { state.isSaving = true; })
      .addCase(reviewSubmission.fulfilled, (state, action) => { state.isSaving = false; upsert(state.list, action.payload); })
      .addCase(reviewSubmission.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload; })

      .addCase(deleteSubmission.pending,   (state) => { state.isDeleting = true; })
      .addCase(deleteSubmission.fulfilled, (state, action) => { state.isDeleting = false; state.list = state.list.filter((s) => s.id !== action.payload); })
      .addCase(deleteSubmission.rejected,  (state, action) => { state.isDeleting = false; state.error = action.payload; });
  },
});

export default submissionsSlice.reducer;
