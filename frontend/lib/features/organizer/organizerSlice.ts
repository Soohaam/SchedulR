import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

interface Booking {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  customer: {
    fullName: string;
    email: string;
  };
  appointmentType: {
    title: string;
    duration: number;
  };
}

interface OrganizerState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  stats: {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    revenue: number;
  };
}

const initialState: OrganizerState = {
  bookings: [],
  isLoading: false,
  error: null,
  stats: {
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    revenue: 0,
  },
};

export const fetchOrganizerBookings = createAsyncThunk(
  'organizer/fetchBookings',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/organiser/bookings', { params: filters });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

const organizerSlice = createSlice({
  name: 'organizer',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizerBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganizerBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns { success, bookings, pagination, summary }
        const data = action.payload;
        state.bookings = data.bookings || [];
        
        // Use summary stats from backend if available
        if (data.summary) {
          state.stats.totalBookings = data.summary.totalBookings || 0;
          state.stats.pendingBookings = data.summary.pendingConfirmation || 0;
          state.stats.confirmedBookings = data.summary.confirmed || 0;
        } else if (data.pagination) {
          // Fallback to pagination total
          state.stats.totalBookings = data.pagination.total || 0;
          state.stats.pendingBookings = state.bookings.filter((b: Booking) => b.status === 'PENDING').length;
          state.stats.confirmedBookings = state.bookings.filter((b: Booking) => b.status === 'CONFIRMED').length;
        } else {
          // Calculate from bookings array
          state.stats.totalBookings = state.bookings.length;
          state.stats.pendingBookings = state.bookings.filter((b: Booking) => b.status === 'PENDING').length;
          state.stats.confirmedBookings = state.bookings.filter((b: Booking) => b.status === 'CONFIRMED').length;
        }
      })
      .addCase(fetchOrganizerBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default organizerSlice.reducer;
