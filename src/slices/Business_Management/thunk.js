import { createAsyncThunk } from "@reduxjs/toolkit";
import { SurPlusCategoryAPI, BusinessAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";

export const {
    list: getCategories,
    create: addCategory,
    update: updateCategory,
    delete: deleteCategory
} = makeCRUDThunks("business-management/surplusCategory", SurPlusCategoryAPI);

export const {
    list: getBusinessesData,
} = makeCRUDThunks("business-management/business", BusinessAPI);

export const createOrUpdateBusiness = createAsyncThunk("business-management/business/createOrUpdateBusiness", async (payload, { dispatch }) => {
    const res = await BusinessAPI.createOrUpdate(payload);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});


// register custom endpoints separately
export const archiveBusiness = createAsyncThunk("business-management/business/archive", async (id, { dispatch }) => {
    const res = await BusinessAPI.archive(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});

export const toggleStatusBusiness = createAsyncThunk("business-management/business/toggleStatus", async (id, { dispatch }) => {
    const res = await BusinessAPI.toggleStatus(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});


export const approveBusiness = createAsyncThunk("business-management/business/approve", async (id, { dispatch }) => {
    const res = await BusinessAPI.approve(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});


export const rejectBusiness = createAsyncThunk("business-management/business/reject", async (id, { dispatch }) => {
    const res = await BusinessAPI.reject(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});



export const signContract = createAsyncThunk("business-management/business/contract", async (payload, { dispatch }) => {
    const res = await BusinessAPI.signContract(payload);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});




