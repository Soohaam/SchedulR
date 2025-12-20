import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import organizerReducer from './features/organizer/organizerSlice';
import appointmentTypeReducer from './features/organizer/appointmentTypeSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      organizer: organizerReducer,
      appointmentType: appointmentTypeReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
