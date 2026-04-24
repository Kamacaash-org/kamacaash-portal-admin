// src/helpers/api_helper.js
import axios from "axios";
import { api } from "../config";

// Setup defaults
axios.defaults.baseURL = api.API_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";

const safeParseAuthUser = () => {
  try {
    const stored = sessionStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

let authExpiryTimeoutId = null;

const decodeJwtPayload = (token) => {
  try {
    const [, payload = ""] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(padded));
  } catch (error) {
    return null;
  }
};

const getTokenExpiryTime = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
};

const clearAuthSessionAndRedirect = () => {
  if (authExpiryTimeoutId) {
    window.clearTimeout(authExpiryTimeoutId);
    authExpiryTimeoutId = null;
  }

  delete axios.defaults.headers.common["Authorization"];

  try {
    sessionStorage.removeItem("authUser");
  } catch (error) {
    // Ignore storage cleanup issues and continue redirecting.
  }

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

const scheduleSessionExpiryRedirect = (token) => {
  if (authExpiryTimeoutId) {
    window.clearTimeout(authExpiryTimeoutId);
    authExpiryTimeoutId = null;
  }

  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) return;

  const remainingMs = expiryTime - Date.now();
  if (remainingMs <= 0) {
    clearAuthSessionAndRedirect();
    return;
  }

  authExpiryTimeoutId = window.setTimeout(() => {
    clearAuthSessionAndRedirect();
  }, remainingMs);
};

const isTokenExpired = (token) => {
  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) return false;
  return expiryTime <= Date.now();
};

const extractTokens = (source) => {
  const data = source?.data || source || {};
  const nestedTokens = data?.tokens || source?.tokens || {};

  const accessToken =
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    source?.accessToken ||
    source?.access_token ||
    source?.token ||
    nestedTokens?.accessToken ||
    nestedTokens?.access_token ||
    nestedTokens?.token ||
    nestedTokens?.access ||
    null;

  const refreshToken =
    data?.refreshToken ||
    data?.refresh_token ||
    source?.refreshToken ||
    source?.refresh_token ||
    nestedTokens?.refreshToken ||
    nestedTokens?.refresh_token ||
    nestedTokens?.refresh ||
    null;

  return { accessToken, refreshToken };
};

export const getAuthTokensFromSession = () => {
  const authData = safeParseAuthUser();
  return extractTokens(authData);
};

// Authorization
const { accessToken: initialAccessToken } = getAuthTokensFromSession();
if (initialAccessToken) {
  axios.defaults.headers.common["Authorization"] =
    "Bearer " + initialAccessToken;
  scheduleSessionExpiryRedirect(initialAccessToken);
}

axios.interceptors.request.use((config) => {
  const { accessToken } = getAuthTokensFromSession();
  if (accessToken) {
    if (isTokenExpired(accessToken)) {
      clearAuthSessionAndRedirect();
      return Promise.reject({
        success: false,
        statusCode: 401,
        data: null,
        message: "Session expired",
      });
    }

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
    scheduleSessionExpiryRedirect(accessToken);
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    // Always wrap successful responses in a unified format
    return {
      success: true,
      statusCode: response.status,
      data: response.data?.data || response.data,
      message: response.data?.message || "Success",
    };
  },
  (error) => {
    const status = error.response?.status || 500;
    const backendMessage = error.response?.data?.message;

    let message;

    switch (status) {
      case 401:
        message = backendMessage || "Invalid credentials";
        clearAuthSessionAndRedirect();
        break;
      case 404:
        message = backendMessage || "Data not found";
        break;
      case 500:
        message = backendMessage || "Something went wrong on the server";
        break;
      default:
        message = backendMessage || error.message || "An error occurred";
    }

    return Promise.reject({
      success: false,
      statusCode: status,
      data: null,
      message,
    });
  },
);
export const getLoggedinUser = () => {
  const user = sessionStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export const setAuthorization = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    scheduleSessionExpiryRedirect(token);
    return;
  }

  if (authExpiryTimeoutId) {
    window.clearTimeout(authExpiryTimeoutId);
    authExpiryTimeoutId = null;
  }

  delete axios.defaults.headers.common["Authorization"];
};

class APIClient {
  get = (url, params) => axios.get(url, { params });
  post = (url, data) => axios.post(url, data);
  update = (url, data) => axios.put(url, data);
  patch = (url, data) => axios.patch(url, data);
  delete = (url) => axios.delete(url);
}

export default new APIClient();
