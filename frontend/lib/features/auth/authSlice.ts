import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  twoFactorToken: string | null;
  twoFactorSetup: { secret: string; otpauthUrl: string } | null;
  requiresEmailVerification: boolean;
  emailToVerify: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  requiresTwoFactor: false,
  twoFactorToken: null,
  twoFactorSetup: null,
  requiresEmailVerification: false,
  emailToVerify: null,
  isLoading: false,
  error: null,
};

// Async Thunks

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/register', userData);
      // If registration returns accessToken immediately (old behavior), store it
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (data: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/verify-email', data);
      localStorage.setItem('token', response.data.accessToken);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Email verification failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/login', credentials);
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async (data: { twoFactorToken: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/2fa/verify', data);
      localStorage.setItem('token', response.data.accessToken);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const generateTwoFactorSetup = createAsyncThunk(
  'auth/generateTwoFactorSetup',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/2fa/setup');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate 2FA setup');
    }
  }
);

export const enableTwoFactor = createAsyncThunk(
  'auth/enableTwoFactor',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/2fa/enable', { code });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enable 2FA');
    }
  }
);

export const disableTwoFactor = createAsyncThunk(
  'auth/disableTwoFactor',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/2fa/disable', { code });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to disable 2FA');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.requiresTwoFactor = false;
      state.twoFactorToken = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresEmailVerification) {
          state.requiresEmailVerification = true;
          state.emailToVerify = action.payload.email;
        } else {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.accessToken;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.requiresEmailVerification = false;
        state.emailToVerify = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requiresTwoFactor) {
          state.requiresTwoFactor = true;
          state.twoFactorToken = action.payload.twoFactorToken;
        } else {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.accessToken;
          state.requiresTwoFactor = false;
          state.twoFactorToken = null;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify 2FA
      .addCase(verifyTwoFactor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.requiresTwoFactor = false;
        state.twoFactorToken = null;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
      })
      // Generate 2FA Setup
      .addCase(generateTwoFactorSetup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateTwoFactorSetup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.twoFactorSetup = action.payload;
      })
      .addCase(generateTwoFactorSetup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Enable 2FA
      .addCase(enableTwoFactor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enableTwoFactor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.twoFactorSetup = null;
      })
      .addCase(enableTwoFactor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Disable 2FA
      .addCase(disableTwoFactor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disableTwoFactor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(disableTwoFactor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
