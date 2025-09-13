// src/slices/setups/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
    getCategories,
    getBusiness,
    getStaffs
} from "./thunk";

export const initialState = {
    categoriesData: [],
    businessesData: [],
    staffsData: [],

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


          builder.addCase(getBusiness.fulfilled, (state, action) => {
            state.businessesData = action.payload;
        });
        builder.addCase(getBusiness.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });


           builder.addCase(getStaffs.fulfilled, (state, action) => {
            state.staffsData = action.payload;
        });
        builder.addCase(getStaffs.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

    }
});

export default BusinessManagementSlice.reducer;