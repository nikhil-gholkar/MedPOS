import {
  createSlice,
} from "@reduxjs/toolkit";

import type {
  Medicine,
} from "./inventoryTypes";

interface InventoryState {
  medicines: Medicine[];

  loading: boolean;
}

const initialState: InventoryState =
  {
    medicines: [],

    loading: false,
  };

const inventorySlice =
  createSlice({
    name: "inventory",

    initialState,

    reducers: {
      setMedicines: (
        state,
        action
      ) => {
        state.medicines =
          action.payload;
      },
    },
  });

export const {
  setMedicines,
} = inventorySlice.actions;

export default inventorySlice.reducer;