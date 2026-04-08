// src/slices/setups/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
  getCategories,
  getCategoriesDDL,
  getBusinessesData,
  getBusinessesByVerificationStatus,
  getBusinessesWithoutContract,
  getBusinessesWithContract,
} from "./thunk";

export const initialState = {
  categoriesData: [],
  categoriesDDL: [],
  businessesData: [],
  businessesByVerificationStatus: [],
  businessesWithoutContract: [],
  businessesWithContract: [],
  error: {},
};
const BusinessManagementSlice = createSlice({
  name: "BusinessManagementSlice",
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

    // DDL case for dropdowns   // this is separate because it uses a different endpoint and data structure than the regular list
    builder.addCase(getCategoriesDDL.fulfilled, (state, action) => {
      state.categoriesDDL = action.payload;
    });
    builder.addCase(getCategoriesDDL.rejected, (state, action) => {
      state.error = action.payload?.error || null;
    });

    // === Businesses ===
    builder.addCase(getBusinessesData.fulfilled, (state, action) => {
      state.businessesData = action.payload;
    });
    builder.addCase(getBusinessesData.rejected, (state, action) => {
      state.error = action.payload?.error || null;
    });

    builder.addCase(
      getBusinessesByVerificationStatus.fulfilled,
      (state, action) => {
        state.businessesByVerificationStatus = action.payload?.list || [];
      },
    );
    builder.addCase(
      getBusinessesByVerificationStatus.rejected,
      (state, action) => {
        state.error = action.payload?.error || null;
      },
    );

    builder.addCase(getBusinessesWithoutContract.fulfilled, (state, action) => {
      state.businessesWithoutContract = action.payload || [];
    });
    builder.addCase(getBusinessesWithoutContract.rejected, (state, action) => {
      state.error = action.payload?.error || null;
    });

    builder.addCase(getBusinessesWithContract.fulfilled, (state, action) => {
      state.businessesWithContract = action.payload || [];
    });
    builder.addCase(getBusinessesWithContract.rejected, (state, action) => {
      state.error = action.payload?.error || null;
    });
  },
});

export default BusinessManagementSlice.reducer;
