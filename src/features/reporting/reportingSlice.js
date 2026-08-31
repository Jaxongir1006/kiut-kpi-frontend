import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';

export const fetchAuditTrace = createAsyncThunk(
  'reporting/fetchAuditTrace',
  async ({ teacherId, yearId }, { rejectWithValue }) => {
    try {
      const base = `/api/reports/audit-trace/${teacherId}/`;
      const url = yearId ? `${base}?year_id=${yearId}` : base;
      return await axiosInstance.get(url);
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const reportingSlice = createSlice({
  name: 'reporting',
  initialState: {
    auditData: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearAudit: (state) => { state.auditData = null; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditTrace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.auditData = null;
      })
      .addCase(fetchAuditTrace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.auditData = action.payload;
      })
      .addCase(fetchAuditTrace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAudit } = reportingSlice.actions;
export default reportingSlice.reducer;
