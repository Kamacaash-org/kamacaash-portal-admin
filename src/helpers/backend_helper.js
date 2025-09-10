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

// ================================== SETTINGS URL ===================================================

//  User APIs
export const UserAPI = {
    list: () => api.get(url.USERS),
    create: (user) => api.create(url.USERS, user),
    update: (user) => api.update(`${url.USERS}/${user.id}`, user),
    delete: (id) => api.delete(`${url.USERS}/${id}`)
};

//  University APIs
export const UniversityAPI = {
    get: () => api.get(url.UNIVERSITY_INFO),
    update: (uni) => api.update(url.UNIVERSITY_INFO, uni)
};

// ================================== END OF SETTINGS URL ===================================================

// // ================================== SETUPS URL ===================================================

export const ProgramCategoryAPI = makeCRUD(url.PROGRAMS_CATEGORY);
export const SchoolAPI = makeCRUD(url.SCHOOLS);
export const DepartmentAPI = makeCRUD(url.DEPARTMENTS);
export const ProgramAPI = makeCRUD(url.PROGRAMS);
export const StaffAPI = makeCRUD(url.STAFFS);

// // ================================== END OF SETUPS URL ===================================================

