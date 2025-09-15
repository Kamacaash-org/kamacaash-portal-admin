// src/helpers/backend_helper.js
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
    ...makeCRUD(url.BUSINESS),

    // extra endpoints
    activate: (id) => api.update(`${url.BUSINESS}/${id}/activate`),
    contract: (payload) => api.update(`${url.BUSINESS}/${payload.id}/contract`, payload)
};

export const StaffsAPI = makeCRUD(url.STAFFS);


export const Surplus_PackageAPI = {
    ...makeCRUD(url.SURPLUS_PACKAGE),

    // extra endpoints
    activate: (id) => api.update(`${url.SURPLUS_PACKAGE}/${id}/activate`)
};


// // ================================== END OF  URL ===================================================

