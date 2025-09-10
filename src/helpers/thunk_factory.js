import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export const makeCRUDThunks = (name, API) => {
    const list = createAsyncThunk(`${name}/list`, async () => {
        const res = await API.list();
        if (!res.success) throw res;
        return res.data;
    });

    const create = createAsyncThunk(`${name}/create`, async (payload, { dispatch }) => {
        const res = await API.create(payload);
        res.success ? toast.success(res.message) : toast.error(res.message);
        dispatch(list()); //  refresh
        return res;
    });

    const update = createAsyncThunk(`${name}/update`, async (payload, { dispatch }) => {
        const res = await API.update(payload);
        res.success ? toast.success(res.message) : toast.error(res.message);
        dispatch(list()); //  refresh
        return res;
    });

    const remove = createAsyncThunk(`${name}/delete`, async (id, { dispatch }) => {
        const res = await API.delete(id);
        res.success ? toast.success(res.message) : toast.error(res.message);
        dispatch(list()); // refresh
        return res;
    });

    return { list, create, update, delete: remove };
};
