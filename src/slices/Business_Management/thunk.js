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
    try {
        const res = await BusinessAPI.createOrUpdate(payload);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getBusinessesData());
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to take an action';
        toast.error(errorMessage);
    }
});


// register custom endpoints separately
export const archiveBusiness = createAsyncThunk("business-management/business/archive", async (id, { dispatch }) => {
    try {
        const res = await BusinessAPI.archive(id);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getBusinessesData());
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete this business';
        toast.error(errorMessage);
    }
});

export const toggleStatusBusiness = createAsyncThunk("business-management/business/toggleStatus", async (payload, { dispatch }) => {
    try {
        const res = await BusinessAPI.toggleStatus(payload);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getBusinessesData());
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to toggle status';
        toast.error(errorMessage);
    }
});


export const approveBusiness = createAsyncThunk("business-management/business/approve", async (id, { dispatch }) => {
    try {
        const res = await BusinessAPI.approve(id);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getBusinessesData());
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to approve';
        toast.error(errorMessage);
    }

});


export const rejectBusiness = createAsyncThunk("business-management/business/reject", async (id, { dispatch }) => {
    try {
        const res = await BusinessAPI.reject(id);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getBusinessesData());
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to reject';
        toast.error(errorMessage);
    }

});



export const signContract = createAsyncThunk("business-management/business/contract", async (payload, { dispatch }) => {

    try {
        const res = await BusinessAPI.signContract(payload);
        if (!res.success) throw res;
        toast.success(res.message);
        dispatch(getBusinessesData());
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to upload contract';
        toast.error(errorMessage);
    }

});




