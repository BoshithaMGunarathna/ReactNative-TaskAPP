import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import messagesReducer from './messagesSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    messages: messagesReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
