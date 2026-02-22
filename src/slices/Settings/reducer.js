import { createSlice } from "@reduxjs/toolkit";
import { getCountries } from "./thunk";

export const initialState = {
  countriesData: [],
  error: {},
};

const SettingsSlice = createSlice({
  name: "SettingsSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getCountries.fulfilled, (state, action) => {
      state.countriesData = action.payload;
    });
    builder.addCase(getCountries.rejected, (state, action) => {
      state.error = action.payload?.error || null;
    });
  },
});

export default SettingsSlice.reducer;
