import { createSlice } from "@reduxjs/toolkit";
import type { AuthUser } from "../../types/auth.types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
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
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  loginSuccess,
  logout,
} = authSlice.actions;

export default authSlice.reducer;