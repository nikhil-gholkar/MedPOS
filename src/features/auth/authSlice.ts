import { createSlice } from "@reduxjs/toolkit";
import type { AuthUser } from "../../types/auth.types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** False until Firebase Auth has resolved its first auth-state event. */
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    loginSuccess: (
      state,
      action: { payload: AuthUser }
    ) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.initialized = true;
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
    },
  },
});

export const {
  loginSuccess,
  logout,
} = authSlice.actions;

export default authSlice.reducer;