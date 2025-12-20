import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

interface AppointmentType {
    id: string;
    title: string;
    description: string;
    duration: number;
    type: string;
    price: number;
    location: string;
    requiresPayment: boolean;
    organizer: {
        id: string;
        name: string;
        image: string | null;
        rating: number | null;
        reviewCount: number;
    };
}

interface Booking {
    id: string;
    appointmentType: {
        title: string;
        duration: number;
    };
    provider: {
        name: string;
        type: string;
    };
    date: string;
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    venue?: string;
    canCancel: boolean;
    cancellationDeadline?: string;
}

interface CustomerState {
    appointments: AppointmentType[];
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;
    stats: {
        totalBookings: number;
        upcomingBookings: number;
        completedBookings: number;
    };
}

const initialState: CustomerState = {
    appointments: [],
    bookings: [],
    isLoading: false,
    error: null,
    stats: {
        totalBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
    },
};

// Fetch available appointments
export const fetchAvailableAppointments = createAsyncThunk(
    'customer/fetchAvailableAppointments',
    async (filters: any = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/v1/appointments/available', { params: filters });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
        }
    }
);

// Fetch customer's bookings
export const fetchCustomerBookings = createAsyncThunk(
    'customer/fetchBookings',
    async (filters: any = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/v1/customer/bookings/my-bookings', { params: filters });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
        }
    }
);

const customerSlice = createSlice({
    name: 'customer',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch available appointments
            .addCase(fetchAvailableAppointments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAvailableAppointments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.appointments = action.payload.data || [];
            })
            .addCase(fetchAvailableAppointments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch customer bookings
            .addCase(fetchCustomerBookings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCustomerBookings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.bookings = action.payload.bookings || [];
                // Calculate stats
                state.stats.totalBookings = action.payload.bookings?.length || 0;
                state.stats.upcomingBookings = action.payload.bookings?.filter(
                    (b: Booking) => b.status === 'CONFIRMED' || b.status === 'PENDING'
                ).length || 0;
                state.stats.completedBookings = action.payload.bookings?.filter(
                    (b: Booking) => b.status === 'COMPLETED'
                ).length || 0;
            })
            .addCase(fetchCustomerBookings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = customerSlice.actions;
export default customerSlice.reducer;
