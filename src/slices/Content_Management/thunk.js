import { createAsyncThunk } from "@reduxjs/toolkit";
import { Surplus_PackageAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";


export const {
    list: getSurplusPackages,
    // create: addSurplusPackage,
    // update: updateSurplusPackage,
    delete: deleteSurplusPackage,
} = makeCRUDThunks("content-operation/surplus-package", Surplus_PackageAPI);

export const activateSurplusPackage = createAsyncThunk("content-operation/surplus-package/activate", async (id, { dispatch }) => {
    const res = await Surplus_PackageAPI.activate(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getSurplusPackages());
    return res;
});


// In your Redux thunks (example)
export const addSurplusPackage = (formData) => async (dispatch) => {
    try {
        const res = await Surplus_PackageAPI.create(formData);
        res.success ? toast.success(res.message) : toast.error(res.message);
        dispatch(getSurplusPackages());
        return res;
    } catch (error) {
        // Handle axios error response
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create package data';
        toast.error(errorMessage);

        // Return error structure to handle in the reducer
        return {
            success: false,
            message: errorMessage,
            errors: error.response?.data?.errors || []
        };
    }
};


export const updateSurplusPackage = (formData) => async (dispatch) => {
    try {

        const res = await Surplus_PackageAPI.update(formData);
        res.success ? toast.success(res.message) : toast.error(res.message);
        dispatch(getSurplusPackages());
        return res;
    } catch (error) {
        // Handle axios error response
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create package data';
        toast.error(errorMessage);

        // Return error structure to handle in the reducer
        return {
            success: false,
            message: errorMessage,
            errors: error.response?.data?.errors || []
        };
    }
};

