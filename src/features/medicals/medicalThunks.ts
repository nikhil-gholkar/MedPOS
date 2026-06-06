import {
  createAsyncThunk,
} from "@reduxjs/toolkit";

import {
  getAllMedicals,
  createMedical,
} from "./medicalService";

import type {
  CreateMedicalPayload,
  UpdateMedicalPayload,
} from "./medicalTypes";

import {
  updateMedical,
  toggleMedicalStatus,
} from "./medicalService";

export const fetchMedicals =
  createAsyncThunk(
    "medicals/fetchMedicals",
    async () => {
      return await getAllMedicals();
    }
  );

export const addMedical =
  createAsyncThunk(
    "medicals/addMedical",
    async (
      payload: CreateMedicalPayload,
      thunkAPI
    ) => {
      await createMedical(payload);

      thunkAPI.dispatch(
        fetchMedicals()
      );
    }
  );

  export const editMedical =
  createAsyncThunk(
    "medicals/editMedical",
    async (
      payload: UpdateMedicalPayload,
      thunkAPI
    ) => {
      await updateMedical(payload);

      thunkAPI.dispatch(
        fetchMedicals()
      );
    }
  );

export const toggleMedical =
  createAsyncThunk(
    "medicals/toggleMedical",
    async (
      {
        medicalId,
        currentStatus,
      }: {
        medicalId: string;
        currentStatus: boolean;
      },
      thunkAPI
    ) => {
      await toggleMedicalStatus(
        medicalId,
        currentStatus
      );

      thunkAPI.dispatch(
        fetchMedicals()
      );
    }
  );