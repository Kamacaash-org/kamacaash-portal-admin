// src/slices/setups/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
    getPendingOrdersByBusinessID,
    getCancelledOrdersByBusinessID,
    getCompletedOrdersByBusinessID
} from "./thunk";

export const initialState = {
    pendingOrdersData: [],
    completedOrders: [],
    cancelledOrders: [],
    error: {},
};
const OrderSlice = createSlice({
    name: 'OrderSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // === pending-orders ===
        builder.addCase(getPendingOrdersByBusinessID.fulfilled, (state, action) => {
            state.pendingOrdersData = action.payload;
        });
        builder.addCase(getPendingOrdersByBusinessID.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === completed-orders ===
        builder.addCase(getCompletedOrdersByBusinessID.fulfilled, (state, action) => {
            state.completedOrders = action.payload;
        });
        builder.addCase(getCompletedOrdersByBusinessID.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === cancelled-orders ===
        builder.addCase(getCancelledOrdersByBusinessID.fulfilled, (state, action) => {
            state.cancelledOrders = action.payload;
        });
        builder.addCase(getCancelledOrdersByBusinessID.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

    }
});

export default OrderSlice.reducer;