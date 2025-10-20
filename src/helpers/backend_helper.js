// src/helpers/backend_helper.js
import axios from "axios";
import api from "./api_helper";
import * as url from "./url_helper";

export const getLoggedInUser = () => {
    const user = localStorage.getItem("user");
    if (user) return JSON.parse(user);
    return null;
};

// //is user is logged in
export const isUserAuthenticated = () => {
    return getLoggedInUser() !== null;
};

// generic CRUD function
const makeCRUD = (endpoint) => ({
    list: () => api.get(endpoint),
    create: (payload) => api.create(endpoint, payload),
    update: (payload) => api.update(`${endpoint}/${payload._id}`, payload),
    delete: (id) => api.delete(`${endpoint}/${id}`)
});

// Auth
export const login = (data) => api.create(url.POST_LOGIN, data);

// // ==================================  URL ===================================================

export const SurPlusCategoryAPI = makeCRUD(url.SURPLUS_CATEGORY);
// Business API with extra endpoints
export const BusinessAPI = {
    list: () => api.get(url.BUSINESS),
    createOrUpdate: (payload) =>
        axios.post(url.BUSINESS, payload, { headers: { 'Content-Type': undefined } }),

    // extra endpoints
    archive: (id) => api.patch(`${url.BUSINESS}/${id}/archive`),
    toggleStatus: (payload) => api.patch(`${url.BUSINESS}/${payload.id}/toggle-status`, payload),
    approve: (id) => api.patch(`${url.BUSINESS}/${id}/approve`),
    reject: (id) => api.patch(`${url.BUSINESS}/${id}/reject`),
    signContract: (payload) => axios.post(`${url.BUSINESS}/sign-contract`, payload, { headers: { 'Content-Type': undefined } }),
};

export const StaffsAPI = makeCRUD(url.STAFFS);


export const Surplus_PackageAPI = {
    list: (id) => api.get(url.SURPLUS_PACKAGE, { businessId: id }),
    delete: (id) => api.delete(`${url.SURPLUS_PACKAGE}/${id}`),
    createOrUpdate: (payload) =>
        axios.post(url.SURPLUS_PACKAGE, payload, { headers: { 'Content-Type': undefined } }),
};




export const OrdersAPI = {
    listPendingOrders: (id) => api.get(`${url.ORDERS}/pending-orders/${id}`),
    completeOrder: (payload) => api.create(`${url.ORDERS}/complete-order`, payload),
    cancelOrder: (payload) => api.create(`${url.ORDERS}/cancel-order`, payload),
    listCompletedOrders: (id) => api.get(`${url.ORDERS}/completed-orders/${id}`),
    listCancelledOrders: (id) => api.get(`${url.ORDERS}/cancelled-orders/${id}`),

};

// // ================================== END OF  URL ===================================================

