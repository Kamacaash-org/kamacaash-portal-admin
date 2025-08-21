// src/slices/settings/thunk.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { UserAPI, UniversityAPI } from "../../helpers/backend_helper";

// Users
export const getUsersData = createAsyncThunk("setting/getUsersData", async () => {
    const res = await UserAPI.list();
    if (!res.success) throw res;
    return res.data;
});

export const addUser = createAsyncThunk("setting/addUser", async (user, { dispatch }) => {
    const res = await UserAPI.create(user);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

export const updateUser = createAsyncThunk("setting/updateUser", async (user, { dispatch }) => {
    const res = await UserAPI.update(user);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

export const deleteUser = createAsyncThunk("setting/deleteUser", async (id, { dispatch }) => {
    const res = await UserAPI.delete(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

// University
export const getUniversityInfo = createAsyncThunk("setting/getUniData", async () => {
    const res = await UniversityAPI.get();
    if (!res.success) throw res;
    return res.data;
});

export const updateUniversity = createAsyncThunk("setting/updateUniData", async (uni, { dispatch }) => {
    const res = await UniversityAPI.update(uni);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUniversityInfo());
    return res;
});
