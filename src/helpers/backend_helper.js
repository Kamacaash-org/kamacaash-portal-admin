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
  update: (payload) => {
    const { id, ...data } = payload;
    return api.update(`${endpoint}/${id}`, data);
  },
  delete: (id) => api.delete(`${endpoint}/${id}`),
});

// Auth
export const login = (data) => api.post(url.POST_LOGIN, data);
export const verify2FA = (data) => api.post(url.VERIFY_2FA, data);
export const changePassword = (data) => api.post(url.CHANGE_PASSWORD, data);
export const getDashboardOverview = () => api.get(url.DASHBOARD_OVERVIEW);
export const getStaffProfile = (staffId) => api.get(`${url.STAFFS}/${staffId}`);
export const getMyStaffProfile = () => api.get("/staff/me/profile");
export const updateMyStaffProfile = (payload) =>
  api.update("/staff/me/profile", payload);
export const getBusinessProfile = (businessId) =>
  api.get(`${url.BUSINESS_PROFILE}/${businessId}`);
export const updateBusinessProfile = (businessId, payload) =>
  api.update(`${url.BUSINESS_PROFILE_UPDATE}/${businessId}`, payload);
export const getAdminBusinessProfile = (businessId) =>
  api.get(`/businesses/${businessId}/profile`);
export const updateAdminBusinessSettings = (businessId, payload) =>
  axios.patch(`/businesses/${businessId}/settings`, payload, {
    headers: { "Content-Type": undefined },
  });
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

export const SurPlusCategoryAPI = {
  list: () => api.get(url.CATEGORIES),

  // DDL endpoint for dropdowns
  ddl: () => api.get(`${url.CATEGORIES}/ddl`),
  create: (payload) =>
    axios.post(url.CATEGORIES, payload, {
      headers: { "Content-Type": undefined },
    }),
  update: (payload) => {
    const { id, formData } = payload;
    return axios.put(`${url.CATEGORIES}/${id}`, formData, {
      headers: { "Content-Type": undefined },
    });
  },
  delete: (id) => api.delete(`${url.CATEGORIES}/${id}`),
};
// Business API with extra endpoints
export const BusinessAPI = {
  list: () => api.get(url.BUSINESS),
  listByVerificationStatus: (status = "PENDING") =>
    api.get(`${url.BUSINESS}/verification/${status}`),
  create: (payload) =>
    payload instanceof FormData
      ? axios.post(url.BUSINESS, payload, {
        headers: { "Content-Type": undefined },
      })
      : api.post(url.BUSINESS, payload),
  update: ({ id, payload }) =>
    payload instanceof FormData
      ? axios.put(`${url.BUSINESS}/${id}`, payload, {
        headers: { "Content-Type": undefined },
      })
      : api.update(`${url.BUSINESS}/${id}`, payload),
  delete: (id) => api.delete(`${url.BUSINESS}/${id}`),

  // extra endpoints
  archive: (id) => api.post(`${url.BUSINESS}/${id}/archive`),
  toggleStatus: ({ id, is_active }) =>
    api.post(`${url.BUSINESS}/${id}/toggleStatus`, { is_active }),
  approve: (id) => api.patch(`${url.BUSINESS}/${id}/approve`),
  reject: (id, payload) => api.patch(`${url.BUSINESS}/${id}/reject`, payload),
  signContract: (payload) =>
    axios.post(`${url.BUSINESS}/sign-contract`, payload, {
      headers: { "Content-Type": undefined },
    }),
};

export const BusinessContractAPI = {
  listWithoutContract: () => api.get("/business-contracts/without-contract"),
  listWithContract: () => api.get("/business-contracts/with-contract"),
  uploadContract: ({ businessId, formData }) =>
    axios.post(`/business-contracts/${businessId}/upload-contract`, formData, {
      headers: { "Content-Type": undefined },
    }),
};
export const StaffsAPI = {
  ...makeCRUD(url.STAFFS),

  ddlUnassigned: () => api.get(`${url.STAFFS}/ddl/unassigned-staff`),
};
export const CountriesAPI = makeCRUD(url.COUNTRIES);
export const CitiesAPI = makeCRUD(url.CITIES);

export const toggleStaff2FA = (enabled) =>
  api.patch(url.TOGGLE_2FA, { enabled });

export const OffersAPI = {
  list: (params) =>
    api.get(url.OFFERS, params),
  create: (payload) =>
    payload instanceof FormData
      ? axios.post(url.OFFERS, payload, {
        headers: { "Content-Type": undefined },
      })
      : api.post(url.OFFERS, payload),
  update: ({ id, payload }) =>
    payload instanceof FormData
      ? axios.put(`${url.OFFERS}/${id}`, payload, {
        headers: { "Content-Type": undefined },
      })
      : api.update(`${url.OFFERS}/${id}`, payload),
  delete: (id) => api.delete(`${url.OFFERS}/${id}`),
  publish: (id) => api.patch(`${url.OFFERS}/${id}/publish`),
};

export const OrdersAPI = {
  listPendingOrders: (id) => api.get(`${url.ORDERS}/business/${id}/pending/today`),
  completeOrder: ({ orderId, payload }) =>
    api.patch(`${url.ORDERS}/${orderId}/complete`, payload),
  cancelOrder: ({ orderId, payload }) =>
    api.patch(`${url.ORDERS}/${orderId}/cancel`, payload),
  listCompletedOrders: ({ businessId, start, end }) =>
    api.get(
      `${url.ORDERS}/business/${businessId}/completed?start=${start}&end=${end}`,
    ),
  listCancelledOrders: ({ businessId, start, end }) =>
    api.get(
      `${url.ORDERS}/business/${businessId}/cancelled?start=${start}&end=${end}`,
    ),
};

// // ================================== END OF  URL ===================================================
