import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchPagedList } from '@/lib/pagination';

const BASE = '/api/activities/appeals/';

export const fetchAppeals = createAsyncThunk(
  'appeals/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchPagedList(BASE);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

// POST /api/activities/appeals/  — FormData (attachment optional)
export const createAppeal = createAsyncThunk(
  'appeals/create',
  async (formData, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(BASE, formData, {
        headers: { 'Content-Type': undefined },
      });
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

// POST /api/activities/appeals/<id>/review/  — JSON
export const reviewAppeal = createAsyncThunk(
  'appeals/review',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await axiosInstance.post(`${BASE}${id}/review/`, data);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

function upsert(list, payload) {
  const idx = list.findIndex((a) => a.id === payload.id);
  if (idx !== -1) list[idx] = payload;
  else list.unshift(payload);
}

const appealsSlice = createSlice({
  name: 'appeals',
  initialState: {
    list: [],
    count: 0,
    hasMore: false,
    isLoading: false,
    isSaving: false,
    isReviewing: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppeals.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchAppeals.fulfilled, (s, a) => {
        s.isLoading = false;
        s.list = a.payload.items;
        s.count = a.payload.count;
        s.hasMore = a.payload.hasMore;
      })
      .addCase(fetchAppeals.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(createAppeal.pending,   (s) => { s.isSaving = true; })
      .addCase(createAppeal.fulfilled, (s, a) => { s.isSaving = false; s.list.unshift(a.payload); })
      .addCase(createAppeal.rejected,  (s, a) => { s.isSaving = false; s.error = a.payload; })

      .addCase(reviewAppeal.pending,   (s) => { s.isReviewing = true; })
      .addCase(reviewAppeal.fulfilled, (s, a) => { s.isReviewing = false; upsert(s.list, a.payload); })
      .addCase(reviewAppeal.rejected,  (s, a) => { s.isReviewing = false; s.error = a.payload; });
  },
});

export default appealsSlice.reducer;
