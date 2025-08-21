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

// Auth
export const login = (data) => api.create(url.POST_LOGIN, data);

// Generic User APIs
export const UserAPI = {
    list: () => api.get(url.GET_USERS),
    create: (user) => api.create(url.ADD_USER, user),
    update: (user) => api.update(`${url.UPDATE_USER}/${user.id}`, user),
    delete: (id) => api.delete(`${url.DELETE_USER}/${id}`)
};

// Generic University APIs
export const UniversityAPI = {
    get: () => api.get(url.GET_UNIVERSITY_INFO),
    update: (uni) => api.update(url.UPDATE_UNIVERSITY_INFO, uni)
};

