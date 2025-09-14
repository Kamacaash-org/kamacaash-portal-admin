// src/slices/setups/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
    getCategories,
    getBusinessesData
} from "./thunk";

export const initialState = {
    categoriesData: [],
    businessesData: [],

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


        builder.addCase(getBusinessesData.fulfilled, (state, action) => {
            state.businessesData = action.payload;
        });
        builder.addCase(getBusinessesData.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });



    }
});

export default BusinessManagementSlice.reducer;