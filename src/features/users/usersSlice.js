import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import { fetchPagedList } from '@/lib/pagination';

const BASE = '/users/';

// Grows with every hire; one max-size page plus `count` instead of walking everything.
export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await fetchPagedList(BASE);
  } catch (err) {
    return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
  }
});

export const batchImportUsers = createAsyncThunk('users/batchImport', async (file, { rejectWithValue }) => {
  try {
    const fd = new FormData();
    fd.append('file', file);
    return await axiosInstance.post(`${BASE}batch-import/`, fd);
  } catch (err) {
    return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
  }
});

export const createUser = createAsyncThunk('users/create', async (data, { rejectWithValue }) => {
  try {
    return await axiosInstance.post(BASE, data);
  } catch (err) {
    return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
  }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await axiosInstance.patch(`${BASE}${id}/`, data);
  } catch (err) {
    return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
  }
});

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`${BASE}${id}/`);
    return id;
  } catch (err) {
    return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    count: 0,
    hasMore: false,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    isImporting: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.isLoading = false;
        s.list = a.payload.items;
        s.count = a.payload.count;
        s.hasMore = a.payload.hasMore;
      })
      .addCase(fetchUsers.rejected, (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(createUser.pending, (s) => { s.isSaving = true; })
      .addCase(createUser.fulfilled, (s, a) => { s.isSaving = false; s.list.unshift(a.payload); })
      .addCase(createUser.rejected, (s, a) => { s.isSaving = false; s.error = a.payload; })

      .addCase(updateUser.pending, (s) => { s.isSaving = true; })
      .addCase(updateUser.fulfilled, (s, a) => {
        s.isSaving = false;
        const idx = s.list.findIndex((u) => u.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(updateUser.rejected, (s, a) => { s.isSaving = false; s.error = a.payload; })

      .addCase(deleteUser.pending, (s) => { s.isDeleting = true; })
      .addCase(deleteUser.fulfilled, (s, a) => { s.isDeleting = false; s.list = s.list.filter((u) => u.id !== a.payload); })
      .addCase(deleteUser.rejected, (s, a) => { s.isDeleting = false; s.error = a.payload; })

      .addCase(batchImportUsers.pending, (s) => { s.isImporting = true; })
      .addCase(batchImportUsers.fulfilled, (s) => { s.isImporting = false; })
      .addCase(batchImportUsers.rejected, (s, a) => { s.isImporting = false; s.error = a.payload; });
  },
});

export default usersSlice.reducer;
