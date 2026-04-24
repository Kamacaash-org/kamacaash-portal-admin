import { createSlice } from "@reduxjs/toolkit";
import { getCities, getCountries } from "./thunk";

export const initialState = {
  countriesData: [],
  citiesData: [],
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
    builder.addCase(getCities.fulfilled, (state, action) => {
      state.citiesData = action.payload;
    });
    builder.addCase(getCities.rejected, (state, action) => {
      state.error = action.payload?.error || null;
    });
  },
});

export default SettingsSlice.reducer;
