import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import organizerReducer from './features/organizer/organizerSlice';
import appointmentTypeReducer from './features/organizer/appointmentTypeSlice';
import customerReducer from './features/customer/customerSlice';
import adminReducer from './features/admin/adminSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      organizer: organizerReducer,
      appointmentType: appointmentTypeReducer,
      customer: customerReducer,
      admin: adminReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
