// src/slices/setups/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
    getCategories,
    // getSchools,
    // getDepartments,
    // getPrograms,
    // getStaffs,
} from "./thunk";

export const initialState = {
    categoriesData: [],
    // schoolsData: [],
    // departmentsData: [],
    // programsData: [],
    // staffsData: [],
    error: {},
};
const BusinessManagementSlice = createSlice({
    name: 'BusinessManagementSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // === Categories ===
        builder.addCase(getCategories.fulfilled, (state, action) => {
            state.categoriesData = action.payload;
        });
        builder.addCase(getCategories.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // // === Schools ===
        // builder.addCase(getSchools.fulfilled, (state, action) => {
        //     state.schoolsData = action.payload;
        // });
        // builder.addCase(getSchools.rejected, (state, action) => {
        //     state.error = action.payload?.error || null;
        // });

        // // === Departments ===
        // builder.addCase(getDepartments.fulfilled, (state, action) => {
        //     state.departmentsData = action.payload;
        // });
        // builder.addCase(getDepartments.rejected, (state, action) => {
        //     state.error = action.payload?.error || null;
        // });

        // // === Programs ===
        // builder.addCase(getPrograms.fulfilled, (state, action) => {
        //     state.programsData = action.payload;
        // });
        // builder.addCase(getPrograms.rejected, (state, action) => {
        //     state.error = action.payload?.error || null;
        // });

        // // === Staffs ===
        // builder.addCase(getStaffs.fulfilled, (state, action) => {
        //     state.staffsData = action.payload;
        // });
        // builder.addCase(getStaffs.rejected, (state, action) => {
        //     state.error = action.payload?.error || null;
        // });

    }
});

export default BusinessManagementSlice.reducer;