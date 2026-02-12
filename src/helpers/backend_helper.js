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
  create: (payload) => api.post(endpoint, payload),
  update: (payload) => api.update(`${endpoint}/${payload._id}`, payload),
  delete: (id) => api.delete(`${endpoint}/${id}`),
});

// Auth
export const login = (data) => api.post(url.POST_LOGIN, data);
export const changePassword = (data) => api.post(url.CHANGE_PASSWORD, data);
export const getDashboardOverview = () => api.get(url.DASHBOARD_OVERVIEW);
export const getStaffProfile = (staffId) =>
  api.get(`${url.STAFF_PROFILE}/${staffId}`);
export const getBusinessProfile = (businessId) =>
  api.get(`${url.BUSINESS_PROFILE}/${businessId}`);
export const updateBusinessProfile = (businessId, payload) =>
  api.update(`${url.BUSINESS_PROFILE_UPDATE}/${businessId}`, payload);
export const getBusinessReviews = (businessId) =>
  api.get(`${url.BUSINESS_REVIEWS}/${businessId}`);
export const requestTopReviewApproval = (payload) =>
  api.post(url.REVIEW_TOP_REQUESTS, payload);
export const getPendingReviewRequests = () =>
  api.get(url.REVIEW_TOP_REQUESTS_PENDING);
export const getReviewRequestsByStatus = (status) =>
  api.get(`${url.REVIEW_TOP_REQUESTS_STATUS}/${status}`);
export const approveReviewRequest = (requestId) =>
  api.post(`${url.REVIEW_TOP_REQUESTS_APPROVE}/${requestId}/approve`);
export const rejectReviewRequest = (requestId, payload) =>
  api.post(`${url.REVIEW_TOP_REQUESTS_REJECT}/${requestId}/reject`, payload);

// // ==================================  URL ===================================================

export const SurPlusCategoryAPI = makeCRUD(url.SURPLUS_CATEGORY);
// Business API with extra endpoints
export const BusinessAPI = {
  list: () => api.get(url.BUSINESS),
  createOrUpdate: (payload) =>
    axios.post(url.BUSINESS, payload, {
      headers: { "Content-Type": undefined },
    }),

  // extra endpoints
  archive: (id) => api.post(`${url.BUSINESS}/${id}/archive`),
  toggleStatus: (payload) =>
    api.patch(`${url.BUSINESS}/${payload.id}/toggle-status`, payload),
  approve: (id) => api.post(`${url.BUSINESS}/${id}/approve`),
  reject: (id) => api.post(`${url.BUSINESS}/${id}/reject`),
  signContract: (payload) =>
    axios.post(`${url.BUSINESS}/sign-contract`, payload, {
      headers: { "Content-Type": undefined },
    }),
};

export const StaffsAPI = makeCRUD(url.STAFFS);

export const Surplus_PackageAPI = {
  list: (id) => api.get(url.SURPLUS_PACKAGE, { businessId: id }),
  delete: (id) => api.delete(`${url.SURPLUS_PACKAGE}/${id}`),
  createOrUpdate: (payload) =>
    axios.post(url.SURPLUS_PACKAGE, payload, {
      headers: { "Content-Type": undefined },
    }),
};

export const OrdersAPI = {
  listPendingOrders: (id) => api.get(`${url.ORDERS}/pending/${id}`),
  completeOrder: (payload) => api.post(`${url.ORDERS}/complete`, payload),
  cancelOrder: (payload) => api.post(`${url.ORDERS}/cancel`, payload),
  listCompletedOrders: (id) => api.get(`${url.ORDERS}/completed/${id}`),
  listCancelledOrders: (id) => api.get(`${url.ORDERS}/cancelled/${id}`),
};

// // ================================== END OF  URL ===================================================
