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
}

axios.interceptors.request.use((config) => {
  const { accessToken } = getAuthTokensFromSession();
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
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
    return;
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
