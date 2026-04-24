import { createSlice } from "@reduxjs/toolkit";
import { getOffers } from "./thunk";

export const initialState = {
  offersData: [],

  error: {},
};
const ContentManagementSlice = createSlice({
  name: "ContentManagementSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // === Offers ===
    builder.addCase(getOffers.fulfilled, (state, action) => {
      state.offersData = action.payload;
    });
    builder.addCase(getOffers.rejected, (state, action) => {
      state.error = action.payload?.error || null;
    });
  },
});

export default ContentManagementSlice.reducer;
