import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import medicalReducer from "../features/medicals/medicalSlice";
import inventoryReducer
from "../features/inventory/inventorySlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    medicals: medicalReducer,
    inventory:
    inventoryReducer,
  },
});

export type RootState =
  ReturnType<typeof store.getState>;

export type AppDispatch =
  typeof store.dispatch;