import { createSlice } from "@reduxjs/toolkit";
import {
    getStaffs,
    getUnAssignedStaffDDL
} from "./thunk";

export const initialState = {
    staffData: [],

    UnAssignedStaffDDL: [],
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


        // DDL case for dropdowns   // this is separate because it uses a different endpoint and data structure than the regular list
        builder.addCase(getUnAssignedStaffDDL.fulfilled, (state, action) => {
            state.UnAssignedStaffDDL = action.payload;
        });
        builder.addCase(getUnAssignedStaffDDL.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

    }
});

export default UserManagementSlice.reducer;