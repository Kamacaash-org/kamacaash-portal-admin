import { createAsyncThunk } from "@reduxjs/toolkit";
import { Surplus_PackageAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";


export const {
    list: getSurplusPackages,
    create: addSurplusPackage,
    update: updateSurplusPackage,
    delete: deleteSurplusPackage,
} = makeCRUDThunks("content-operation/surplus-package", Surplus_PackageAPI);

export const activateSurplusPackage = createAsyncThunk("content-operation/surplus-package/activate", async (id, { dispatch }) => {
    const res = await Surplus_PackageAPI.activate(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getSurplusPackages());
    return res;
});



