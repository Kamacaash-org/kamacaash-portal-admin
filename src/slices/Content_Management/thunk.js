import { createAsyncThunk } from "@reduxjs/toolkit";
import { OffersAPI } from "../../helpers/backend_helper";
import { toast } from "react-toastify";

export const getOffers = createAsyncThunk(
  "content-management/offers/get",
  async (_, thunkAPI) => {
    try {
      const res = await OffersAPI.list();
      if (!res.success) throw res;
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load offers";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(error);
    }
  },
);

export const createOffer = createAsyncThunk(
  "content-management/offers/create",
  async (input, { dispatch, rejectWithValue }) => {
    try {
      const payload = input?.payload || input;
      const res = await OffersAPI.create(payload);
      if (!res.success) throw res;

      dispatch(getOffers());
      toast.success(res.message || "Offer created successfully");
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create offer";
      toast.error(errorMessage);
      return rejectWithValue(error);
    }
  },
);

export const updateOffer = createAsyncThunk(
  "content-management/offers/update",
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const res = await OffersAPI.update({ id, payload });
      if (!res.success) throw res;

      dispatch(getOffers());
      toast.success(res.message || "Offer updated successfully");
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update offer";
      toast.error(errorMessage);
      return rejectWithValue(error);
    }
  },
);

export const deleteOffer = createAsyncThunk(
  "content-management/offers/delete",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const res = await OffersAPI.delete(id);
      if (!res.success) throw res;

      dispatch(getOffers());
      toast.success(res.message || "Offer deleted successfully");
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete offer";
      toast.error(errorMessage);
      return rejectWithValue(error);
    }
  },
);

export const publishOffer = createAsyncThunk(
  "content-management/offers/publish",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const res = await OffersAPI.publish(id);
      if (!res.success) throw res;

      dispatch(getOffers());
      toast.success(res.message || "Offer published successfully");
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to publish offer";
      toast.error(errorMessage);
      return rejectWithValue(error);
    }
  },
);
