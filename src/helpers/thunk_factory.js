import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";


/**
 * makeCRUDThunks
 * @param name string - slice name (used for action types)
 * @param API object - must have list(), create(payload), update(payload), delete(id)
 * @param options object - optional config
 *   options.isDDL: boolean - if true, transforms list for dropdown
 *   options.labelKey: string - label field for dropdown
 *   options.valueKey: string - value field for dropdown
 *   options.metaKeys: string[] - extra meta fields
 */
export const makeCRUDThunks = (name, API, options = {}) => {
    const {
        isDDL = false,
        labelKey = "name",
        valueKey = "id",
        metaKeys = [],
        ddlListKeys = null,
        fallbackLabelKeys = ["name", "label", "title"],
        fallbackValueKeys = ["id", "_id", "value", "uuid"],
    } = options;

    // ---------------- LIST ----------------
    const list = createAsyncThunk(`${name}/list`, async (_, thunkAPI) => {
        try {
            const res = await API.list();
            if (!res.success) throw res;

            let data = res.data;

            if (isDDL) {
                data = Array.isArray(data) ? data : [];
            }

            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error);
        }
    });

    // ---------------- CREATE ----------------
    const create = createAsyncThunk(`${name}/create`, async (payload, { dispatch, rejectWithValue }) => {
        try {
            const res = await API.create(payload);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(list()); // refresh
            return res;
        } catch (error) {
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Create failed");
            toast.error(message);
            return rejectWithValue(error);
        }
    });

    // ---------------- UPDATE ----------------
    const update = createAsyncThunk(`${name}/update`, async (payload, { dispatch, rejectWithValue }) => {
        try {
            const res = await API.update(payload);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(list());
            return res;
        } catch (error) {
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Update failed");
            toast.error(message);
            return rejectWithValue(error);
        }
    });

    // ---------------- DELETE ----------------
    const remove = createAsyncThunk(`${name}/delete`, async (id, { dispatch, rejectWithValue }) => {
        try {
            const res = await API.delete(id);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(list());
            return res;
        } catch (error) {
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Delete failed");
            toast.error(message);
            return rejectWithValue(error);
        }
    });

    return { list, create, update, delete: remove };
};

export const makeDDLThunks = (name, listAPI, options = {}) => {
    const list = typeof listAPI === "function" ? listAPI : listAPI?.list;
    return makeCRUDThunks(name, { list }, { ...options, isDDL: true });
};
