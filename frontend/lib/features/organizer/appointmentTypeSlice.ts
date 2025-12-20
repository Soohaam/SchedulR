import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

// Fix API path mismatch
const API_URL = '/api/v1/organiser/appointment-types';

interface Question {
  id?: string;
  questionText: string;
  questionType: string;
  options?: string[];
  isRequired: boolean;
  order: number;
}

interface WorkingHour {
  id?: string;
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakStart?: string | null;
  breakEnd?: string | null;
}

interface CancellationPolicy {
  id?: string;
  allowCancellation: boolean;
  cancellationDeadlineHours: number;
  refundPercentage: number;
  cancellationFee?: number | null;
  noShowPolicy?: string | null;
}

interface AppointmentType {
  id: string;
  name?: string; // Frontend might use name, backend sends title. Check usage.
  title: string;
  description: string;
  duration: number;
  price: number;
  isActive?: boolean;
  isPublished: boolean;
  // New fields
  type: 'USER' | 'RESOURCE';
  location?: string;
  meetingUrl?: string;
  introductoryMessage?: string;
  color?: string;
  maxBookingsPerSlot: number;
  manageCapacity: boolean;
  requiresPayment: boolean;
  manualConfirmation: boolean;
  autoAssignment: boolean;
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingDays: number;
  bufferTimeMinutes: number;
  confirmationMessage?: string;
  shareLink?: string;

  questions: Question[];
  workingHours: WorkingHour[];
  cancellationPolicy: CancellationPolicy | null;

  statistics?: {
    totalBookings: number;
    upcomingBookings?: number;
    revenue: number;
    completionRate?: number;
    averageRating?: number;
  };
}

interface AppointmentTypeState {
  types: AppointmentType[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AppointmentTypeState = {
  types: [],
  isLoading: false,
  error: null,
};

export const fetchAppointmentTypes = createAsyncThunk(
  'appointmentType/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URL);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointment types');
    }
  }
);

export const fetchAppointmentTypeById = createAsyncThunk(
  'appointmentType/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data.appointmentType; // Backend returns { success: true, appointmentType: {...} }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointment type');
    }
  }
);

export const createAppointmentType = createAsyncThunk(
  'appointmentType/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_URL, data);
      return response.data.appointmentType;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create appointment type');
    }
  }
);

export const updateAppointmentType = createAsyncThunk(
  'appointmentType/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${API_URL}/${id}`, data);
      return response.data.appointmentType;
    } catch (error: any) {
      // If we're updating questions/schedule, the backend effectively returns the new full object
      return response.data;
    }
  }
);

export const deleteAppointmentType = createAsyncThunk(
  'appointmentType/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete appointment type');
    }
  }
);

const appointmentTypeSlice = createSlice({
  name: 'appointmentType',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointmentTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.types = action.payload;
      })
      .addCase(fetchAppointmentTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAppointmentTypeById.fulfilled, (state, action) => {
        const index = state.types.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.types[index] = action.payload;
        } else {
          state.types.push(action.payload);
        }
      })
      .addCase(createAppointmentType.fulfilled, (state, action) => {
        state.types.push(action.payload);
      })
      .addCase(updateAppointmentType.fulfilled, (state, action) => {
        const index = state.types.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.types[index] = action.payload;
        }
      })
      .addCase(deleteAppointmentType.fulfilled, (state, action) => {
        state.types = state.types.filter((t) => t.id !== action.payload);
      });
  },
});

export default appointmentTypeSlice.reducer;
