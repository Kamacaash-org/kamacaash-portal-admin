import { createAsyncThunk } from "@reduxjs/toolkit";
import { OrdersAPI } from "../../helpers/backend_helper";
import { toast } from "react-toastify";


export const getPendingOrdersByBusinessID = createAsyncThunk("orders/order/return-pending-orders", async (id) => {
    try {
        const res = await OrdersAPI.listPendingOrders(id);
        if (!res.success) throw res;
        return res.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load pending orders';
        toast.error(errorMessage);
    }

});

export const getCompletedOrdersByBusinessID = createAsyncThunk("orders/order/return-completed-orders", async (payload) => {
    try {
        const res = await OrdersAPI.listCompletedOrders(payload);
        if (!res.success) throw res;
        return res.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load completed orders';
        toast.error(errorMessage);
    }

});
export const getCancelledOrdersByBusinessID = createAsyncThunk("orders/order/return-cancelled-orders", async (payload) => {
    try {
        const res = await OrdersAPI.listCancelledOrders(payload);
        if (!res.success) throw res;
        return res.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load cancelled orders';
        toast.error(errorMessage);
    }

});

export const completeOrder = createAsyncThunk("orders/complete-order", async (payload) => {
    try {
        const res = await OrdersAPI.completeOrder({
            orderId: payload.orderId,
            payload: {
                pin_code: payload.pinCode,
            },
        });
        if (!res.success) throw res;
        toast.success(`Order ${payload.orderLabel || payload.orderNumber || payload.orderId} completed successfully!`);
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to complete the order';
        toast.error(errorMessage);
    }
});


export const cancelOrder = createAsyncThunk("order/cancel-order", async (payload) => {
    try {
        const res = await OrdersAPI.cancelOrder({
            orderId: payload.orderId,
            payload: {
                reason: payload.cancellationReason,
            },
        });
        if (!res.success) throw res;
        toast.success(`Order ${payload.orderLabel || payload.orderNumber || payload.orderId} cancelled successfully!`);
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel the order';
        toast.error(errorMessage);
    }
});


