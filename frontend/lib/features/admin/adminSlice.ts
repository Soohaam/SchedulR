import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as adminApi from './adminApi';
import type {
  User,
  UserWithStats,
  Appointment,
  DashboardStats,
  Pagination,
} from './adminApi';

interface AdminState {
  dashboardStats: DashboardStats | null;
  users: User[];
  selectedUser: UserWithStats | null;
  appointments: Appointment[];
  usersPagination: Pagination | null;
  appointmentsPagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboardStats: null,
  users: [],
  selectedUser: null,
  appointments: [],
  usersPagination: null,
  appointmentsPagination: null,
  isLoading: false,
  error: null,
};

// Async Thunks

export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminApi.getDashboardStats();
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard stats'
      );
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (
    filters: {
      role?: string;
      isActive?: boolean;
      isVerified?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await adminApi.getAllUsers(filters);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch users'
      );
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'admin/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await adminApi.getUserById(userId);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user details'
      );
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'admin/toggleUserStatus',
  async (
    { userId, isActive }: { userId: string; isActive: boolean },
    { rejectWithValue }
  ) => {
    try {
      const data = await adminApi.toggleUserStatus(userId, isActive);
      return { userId, isActive, ...data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle user status'
      );
    }
  }
);

export const changeUserRole = createAsyncThunk(
  'admin/changeUserRole',
  async (
    { userId, newRole }: { userId: string; newRole: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await adminApi.changeUserRole(userId, newRole);
      return { userId, newRole, ...data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to change user role'
      );
    }
  }
);

export const fetchAppointments = createAsyncThunk(
  'admin/fetchAppointments',
  async (
    filters: {
      status?: string;
      organizerId?: string;
      customerId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await adminApi.getAllAppointments(filters);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch appointments'
      );
    }
  }
);

// Slice

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.usersPagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch User By ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUser = {
          ...action.payload.user,
          statistics: action.payload.statistics,
        };
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Toggle User Status
    builder
      .addCase(toggleUserStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update user in the list
        const userIndex = state.users.findIndex((u) => u.id === action.payload.userId);
        if (userIndex !== -1) {
          state.users[userIndex].isActive = action.payload.isActive;
        }
        // Update selected user if it's the same
        if (state.selectedUser?.id === action.payload.userId) {
          state.selectedUser.isActive = action.payload.isActive;
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Change User Role
    builder
      .addCase(changeUserRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update user in the list
        const userIndex = state.users.findIndex((u) => u.id === action.payload.userId);
        if (userIndex !== -1) {
          state.users[userIndex].role = action.payload.newRole as any;
        }
        // Update selected user if it's the same
        if (state.selectedUser?.id === action.payload.userId) {
          state.selectedUser.role = action.payload.newRole as any;
        }
      })
      .addCase(changeUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Appointments
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload.appointments;
        state.appointmentsPagination = action.payload.pagination;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedUser } = adminSlice.actions;

export default adminSlice.reducer;
