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
    list: () => api.get(url.SURPLUS_PACKAGE),

    delete: (id) => api.delete(`${url.SURPLUS_PACKAGE}/${id}`),

    create: (formData) => {
        // Check if it's FormData (for file uploads) or regular data
        if (formData instanceof FormData) {
            // For FormData, use post with multipart/form-data headers
            return axios.post(url.SURPLUS_PACKAGE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } else {
            // For regular JSON data, use the existing api.update method
            return api.create(url.SURPLUS_PACKAGE, formData);
        }
    },

    update: (formData) => {
        // Check if it's FormData (for file uploads) or regular data
        if (formData instanceof FormData) {
            // For FormData, use post with multipart/form-data headers
            return axios.post(url.SURPLUS_PACKAGE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } else {
            // For regular JSON data, use the existing api.update method
            return api.update(url.SURPLUS_PACKAGE, formData);
        }
    }
};
// // ================================== END OF  URL ===================================================

