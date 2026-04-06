import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const DEFAULT_DDL_LIST_KEYS = [
    "rows",
    "data",
    "items",
    "results",
    "categories",
    "staffs",
    "businesses",
];

const toArray = (payload, keys = DEFAULT_DDL_LIST_KEYS) => {
    if (Array.isArray(payload)) return payload;
    for (const key of keys) {
        if (Array.isArray(payload?.[key])) return payload[key];
    }
    return [];
};

const pickFirstDefined = (obj, keys = []) => {
    for (const key of keys) {
        if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
            return obj[key];
        }
    }
    return undefined;
};

const normalizeDDLItem = (item, config) => {
    const {
        labelKey,
        valueKey,
        metaKeys,
        fallbackLabelKeys,
        fallbackValueKeys,
    } = config;
    const value =
        item?.[valueKey] ?? pickFirstDefined(item, fallbackValueKeys);
    const label =
        item?.[labelKey] ??
        pickFirstDefined(item, fallbackLabelKeys) ??
        (value !== undefined && value !== null ? String(value) : "");
    const meta = {};
    metaKeys.forEach((key) => {
        if (item?.[key] !== undefined) meta[key] = item[key];
    });
    return {
        label,
        value,
        meta: Object.keys(meta).length ? meta : undefined,
    };
};

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
        ddlListKeys = DEFAULT_DDL_LIST_KEYS,
        fallbackLabelKeys = ["name", "label", "title"],
        fallbackValueKeys = ["id", "_id", "value", "uuid"],
    } = options;

    // ---------------- LIST ----------------
    const list = createAsyncThunk(`${name}/list`, async (_, thunkAPI) => {
        try {
            const res = await API.list();
            if (!res.success) throw res;

            let data = res.data;

            // Transform to DDL if requested
            if (isDDL) {
                data = toArray(data, ddlListKeys).map((item) =>
                    normalizeDDLItem(item, {
                        labelKey,
                        valueKey,
                        metaKeys,
                        fallbackLabelKeys,
                        fallbackValueKeys,
                    }),
                );
            }

            return data;
        } catch (error) {
            const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Failed to fetch list");
            toast.error(message);
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

// import { createAsyncThunk } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export const makeCRUDThunks = (name, API) => {
//     // console.log("API is:", API)
//     const list = createAsyncThunk(`${name}/list`, async (_, thunkAPI) => {
//         try {
//             const res = await API.list();
//             if (!res.success) throw res;
//             // console.log("res data is:", res.data)
//             return res.data;
//         } catch (error) {
//             const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Failed to fetch list");
//             toast.error(message);
//             return thunkAPI.rejectWithValue(error);
//         }
//     });

//     const create = createAsyncThunk(`${name}/create`, async (payload, { dispatch, rejectWithValue }) => {
//         try {
//             const res = await API.create(payload);
//             // console.log("res is:", res)
//             if (!res.success) throw res;
//             toast.success(res.message);
//             dispatch(list()); // refresh
//             return res;
//         } catch (error) {
//             console.log("error is:", error)
//             const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Create failed");
//             toast.error(message);
//             return rejectWithValue(error);
//         }
//     });

//     const update = createAsyncThunk(`${name}/update`, async (payload, { dispatch, rejectWithValue }) => {
//         try {
//             const res = await API.update(payload);
//             console.log("res is:", res)
//             if (!res.success) throw res;
//             toast.success(res.message);
//             dispatch(list()); // refresh
//             return res;
//         } catch (error) {
//             const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Update failed");
//             toast.error(message);
//             return rejectWithValue(error);
//         }
//     });

//     const remove = createAsyncThunk(`${name}/delete`, async (id, { dispatch, rejectWithValue }) => {
//         try {
//             const res = await API.delete(id);
//             if (!res.success) throw res;
//             toast.success(res.message);
//             dispatch(list()); // refresh
//             return res;
//         } catch (error) {
//             const message = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || "Delete failed");
//             toast.error(message);
//             return rejectWithValue(error);
//         }
//     });

//     return { list, create, update, delete: remove };
// };
