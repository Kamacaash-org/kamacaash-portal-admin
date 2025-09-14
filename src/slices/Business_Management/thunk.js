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
    create: addBusiness,
    update: updateBusiness,
    delete: deleteBusiness,
} = makeCRUDThunks("business-management/business", BusinessAPI);

// register custom endpoints separately
export const activateBusiness = createAsyncThunk("business-management/business/activate", async (id, { dispatch }) => {
    const res = await BusinessAPI.activate(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});

export const signContract = createAsyncThunk("business-management/business/contract", async (payload, { dispatch }) => {
    const res = await BusinessAPI.contract(payload);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getBusinessesData());
    return res;
});




