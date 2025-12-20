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
    name: string;
    duration: number;
    price: number;
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
        state.bookings = action.payload.bookings;
        // Calculate stats from bookings for now (or fetch from backend if available)
        state.stats.totalBookings = action.payload.meta.total;
        state.stats.pendingBookings = action.payload.bookings.filter((b: Booking) => b.status === 'PENDING').length;
        state.stats.confirmedBookings = action.payload.bookings.filter((b: Booking) => b.status === 'CONFIRMED').length;
        // Revenue calculation would typically come from backend
      })
      .addCase(fetchOrganizerBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default organizerSlice.reducer;
