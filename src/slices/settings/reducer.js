import { createSlice } from "@reduxjs/toolkit";
import { getUsersData, getUniversityInfo } from './thunk';
export const initialState = {
    usersData: [],
    uniData: [],
    error: {},
};

const SettingSlice = createSlice({
    name: 'SettingSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getUsersData.fulfilled, (state, action) => {
            state.usersData = action.payload;
        });
        builder.addCase(getUsersData.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });

        // university
        builder.addCase(getUniversityInfo.fulfilled, (state, action) => {
            state.uniData = action.payload;
        });
        builder.addCase(getUniversityInfo.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });
    }
});

export default SettingSlice.reducer;