import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  SurPlusCategoryAPI,
  BusinessAPI,
  BusinessContractAPI,
} from "../../helpers/backend_helper";
import { makeCRUDThunks, makeDDLThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";

export const {
  list: getCategories,
  create: addCategory,
  update: updateCategory,
  delete: deleteCategory,
} = makeCRUDThunks("business-management/surplusCategory", SurPlusCategoryAPI);

// DDL (dropdown) — call the new ddl endpoint
export const { list: getCategoriesDDL } = makeDDLThunks(
  "categories/ddl",
  SurPlusCategoryAPI.ddl,
  {
    labelKey: "name",
    valueKey: "id",
    metaKeys: ["slug"],
  },
);

export const { list: getBusinessesData } = makeCRUDThunks(
  "business-management/business",
  BusinessAPI,
);

export const createOrUpdateBusiness = createAsyncThunk(
  "business-management/business/createOrUpdateBusiness",
  async (payload, { dispatch }) => {
    try {
      const isUpdate = !!payload?.id;
      const res = isUpdate
        ? await BusinessAPI.update({ id: payload.id, payload: payload.data })
        : await BusinessAPI.create(payload?.data ?? payload);
      if (!res.success) throw res;
      toast.success(res.message);

      dispatch(getBusinessesData());
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to take an action";
      toast.error(errorMessage);
      throw error;
    }
  },
);

// register custom endpoints separately
export const archiveBusiness = createAsyncThunk(
  "business-management/business/archive",
  async (id, { dispatch }) => {
    try {
      const res = await BusinessAPI.delete(id);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete this business";
      toast.error(errorMessage);
    }
  },
);

export const toggleStatusBusiness = createAsyncThunk(
  "business-management/business/toggleStatus",
  async (payload, { dispatch }) => {
    try {
      const res = await BusinessAPI.toggleStatus(payload);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to toggle status";
      toast.error(errorMessage);
    }
  },
);

export const approveBusiness = createAsyncThunk(
  "business-management/business/approve",
  async (id, { dispatch }) => {
    try {
      const res = await BusinessAPI.approve(id);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to approve";
      toast.error(errorMessage);
    }
  },
);

export const rejectBusiness = createAsyncThunk(
  "business-management/business/reject",
  async ({ id, reason }, { dispatch }) => {
    try {
      const res = await BusinessAPI.reject(id, { reason });
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to reject";
      toast.error(errorMessage);
      throw error;
    }
  },
);

export const signContract = createAsyncThunk(
  "business-management/business/contract",
  async (payload, { dispatch }) => {
    try {
      const res = await BusinessAPI.signContract(payload);
      if (!res.success) throw res;
      toast.success(res.message);
      dispatch(getBusinessesData());
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload contract";
      toast.error(errorMessage);
    }
  },
);

export const getBusinessesByVerificationStatus = createAsyncThunk(
  "business-management/business/getByVerificationStatus",
  async (status = "PENDING", { rejectWithValue }) => {
    try {
      const res = await BusinessAPI.listByVerificationStatus(status);
      if (!res.success) throw res;
      return { status, list: res.data || [] };
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getBusinessesWithoutContract = createAsyncThunk(
  "business-management/contracts/getWithoutContract",
  async (_, { rejectWithValue }) => {
    try {
      const res = await BusinessContractAPI.listWithoutContract();
      if (!res.success) throw res;
      return res.data || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getBusinessesWithContract = createAsyncThunk(
  "business-management/contracts/getWithContract",
  async (_, { rejectWithValue }) => {
    try {
      const res = await BusinessContractAPI.listWithContract();
      if (!res.success) throw res;
      return res.data || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const uploadBusinessContract = createAsyncThunk(
  "business-management/contracts/upload",
  async (
    { businessId, contractDocument, version = "v1" },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append("contractDocument", contractDocument);
      formData.append("version", version);

      const res = await BusinessContractAPI.uploadContract({
        businessId,
        formData,
      });
      if (!res.success) throw res;

      toast.success(res.message || "Contract uploaded successfully");
      dispatch(getBusinessesWithoutContract());
      dispatch(getBusinessesWithContract());
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload contract";
      toast.error(errorMessage);
      return rejectWithValue(error);
    }
  },
);
