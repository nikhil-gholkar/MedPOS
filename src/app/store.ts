import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import medicalReducer from "../features/medicals/medicalSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    medicals: medicalReducer,
  },
});

export type RootState =
  ReturnType<typeof store.getState>;

export type AppDispatch =
  typeof store.dispatch;