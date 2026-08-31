import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPagedList, unwrapCount, unwrapList } from '@/lib/pagination';

// Summaries and the leaderboard grow with (teachers x years) — one large page instead of a
// full walk, and `count` is kept so the UI can say how many rows exist server-side.
export const fetchSummaries = createAsyncThunk(
  'scoring/fetchSummaries',
  async (yearId, { rejectWithValue }) => {
    try {
      return await fetchPagedList('/api/scoring/summaries/', yearId ? { year_id: yearId } : {});
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'scoring/fetchLeaderboard',
  async (yearId, { rejectWithValue }) => {
    try {
      const { raw } = await fetchPagedList(
        '/api/scoring/summaries/leaderboard/',
        yearId ? { year_id: yearId } : {}
      );
      // This endpoint adds `academic_year` alongside the standard page envelope.
      return {
        rows: unwrapList(raw),
        count: unwrapCount(raw),
        academicYear: raw?.academic_year ?? null,
      };
    } catch (err) {
      return rejectWithValue(err.detail || err.message || 'Xatolik yuz berdi');
    }
  }
);

const scoringSlice = createSlice({
  name: 'scoring',
  initialState: {
    summaries: [],
    summariesCount: 0,
    summariesHasMore: false,
    leaderboard: [],
    leaderboardCount: 0,
    leaderboardYear: null,
    isLoading: false,
    isLeaderboardLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummaries.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchSummaries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summaries = action.payload.items;
        state.summariesCount = action.payload.count;
        state.summariesHasMore = action.payload.hasMore;
      })
      .addCase(fetchSummaries.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(fetchLeaderboard.pending, (state) => { state.isLeaderboardLoading = true; })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLeaderboardLoading = false;
        state.leaderboard = action.payload.rows;
        state.leaderboardCount = action.payload.count;
        state.leaderboardYear = action.payload.academicYear;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => { state.isLeaderboardLoading = false; state.error = action.payload; });
  },
});

export default scoringSlice.reducer;
