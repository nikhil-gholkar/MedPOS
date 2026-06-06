import { createSlice } from "@reduxjs/toolkit";

import type { Medical } from "./medicalTypes";

import { fetchMedicals } from "./medicalThunks";

interface MedicalState {
  medicals: Medical[];
  loading: boolean;
  error: string | null;
}

const initialState: MedicalState = {
  medicals: [],
  loading: false,
  error: null,
};

const medicalSlice = createSlice({
  name: "medicals",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(
        fetchMedicals.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchMedicals.fulfilled,
        (state, action) => {
          state.loading = false;
          state.medicals =
            action.payload;
        }
      )

      .addCase(
        fetchMedicals.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.error.message ||
            "Something went wrong";
        }
      );
  },
});

export default medicalSlice.reducer;