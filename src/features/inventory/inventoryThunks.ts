import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  createMedicine,
  getMedicines,
} from "./inventoryService";

import { setMedicines } from "./inventorySlice";

import type {
  CreateMedicinePayload,
} from "./inventoryTypes";

export const fetchMedicines =
  createAsyncThunk(
    "inventory/fetchMedicines",
    async (
      medicalId: string,
      thunkAPI
    ) => {
      const medicines =
        await getMedicines(
          medicalId
        );

      thunkAPI.dispatch(
        setMedicines(
          medicines
        )
      );
    }
  );

export const addMedicine =
  createAsyncThunk(
    "inventory/addMedicine",
    async (
      {
        medicalId,
        payload,
      }: {
        medicalId: string;
        payload: CreateMedicinePayload;
      },
      thunkAPI
    ) => {
      await createMedicine(
        medicalId,
        payload
      );

      thunkAPI.dispatch(
        fetchMedicines(
          medicalId
        )
      );
    }
  );