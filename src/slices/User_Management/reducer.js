import { createSlice } from "@reduxjs/toolkit";
import {
    getStaffs
} from "./thunk";

export const initialState = {
    staffData: [],

    error: {},
};
const UserManagementSlice = createSlice({
    name: 'UserManagementSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getStaffs.fulfilled, (state, action) => {
            state.staffData = action.payload;
        });
        builder.addCase(getStaffs.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });
    }
});

export default UserManagementSlice.reducer;