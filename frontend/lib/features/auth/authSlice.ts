import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  isTwoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  sessionExpiry: number | null; // Unix timestamp in milliseconds
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
  sessionExpiry: typeof window !== 'undefined' ?
    (localStorage.getItem('sessionExpiry') ? Number(localStorage.getItem('sessionExpiry')) : null) : null,
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
  async ({ role, ...userData }: any, { rejectWithValue }) => {
    try {
      const endpoint = role === 'organiser'
        ? '/api/v1/auth/register/organiser'
        : '/api/v1/auth/register/customer';

      const response = await api.post(endpoint, userData);
      // If registration returns accessToken immediately (old behavior), store it
      if (response.data.accessToken) {
        const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('sessionExpiry', sessionExpiry.toString());
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
      const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('sessionExpiry', sessionExpiry.toString());
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
        const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('sessionExpiry', sessionExpiry.toString());
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
      const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('sessionExpiry', sessionExpiry.toString());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check if session is expired before making request
      const state = getState() as { auth: AuthState };
      if (state.auth.sessionExpiry && Date.now() > state.auth.sessionExpiry) {
        localStorage.removeItem('token');
        localStorage.removeItem('sessionExpiry');
        return rejectWithValue('Session expired');
      }
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
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: { token: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password reset failed');
    }
  }
);

// Validate current session
export const validateSession = createAsyncThunk(
  'auth/validateSession',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };

      // Check if token exists
      if (!state.auth.token) {
        return rejectWithValue('No token found');
      }

      // Check if session is expired
      if (state.auth.sessionExpiry && Date.now() > state.auth.sessionExpiry) {
        localStorage.removeItem('token');
        localStorage.removeItem('sessionExpiry');
        return rejectWithValue('Session expired');
      }

      // Validate with backend
      const response = await api.get('/api/v1/auth/me');
      return response.data;
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionExpiry');
      return rejectWithValue(error.response?.data?.message || 'Session validation failed');
    }
  }
);
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Clear all localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('sessionExpiry');

      // Reset all state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.sessionExpiry = null;
      state.requiresTwoFactor = false;
      state.twoFactorToken = null;
      state.twoFactorSetup = null;
      state.requiresEmailVerification = false;
      state.emailToVerify = null;
      state.error = null;
    },
    sessionExpired: (state) => {
      // Clear all localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('sessionExpiry');

      // Reset all state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.sessionExpiry = null;
      state.requiresTwoFactor = false;
      state.twoFactorToken = null;
      state.error = 'Your session has expired. Please log in again.';
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
          state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
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
        state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
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
          state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
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
        state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
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
        // Backend returns { user: {...} }, so we need to extract the user object
        state.user = action.payload.user || action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.sessionExpiry = null;
        localStorage.removeItem('token');
        localStorage.removeItem('sessionExpiry');
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
      })
      // Validate Session
      .addCase(validateSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(validateSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        // Backend returns { user: {...} }, so we need to extract the user object
        state.user = action.payload.user || action.payload;
      })
      .addCase(validateSession.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.sessionExpiry = null;
      });
  },
});

export const { logout, sessionExpired, clearError } = authSlice.actions;
export default authSlice.reducer;
