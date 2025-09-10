// src/helpers/api_helper.js
import axios from "axios";
import { api } from "../config";

// Setup defaults
axios.defaults.baseURL = api.API_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";

// Authorization
const token = JSON.parse(sessionStorage.getItem("authUser"))?.token || null;
if (token) axios.defaults.headers.common["Authorization"] = "Bearer " + token;

axios.interceptors.response.use(
  (response) => {
    // Always wrap response in unified format
    return {
      success: true,
      statusCode: response.status,
      data: response.data?.data || response.data,
      message: response.data?.message || "Success",
    };
  },
  (error) => {
    let message;
    const status = error.response?.status || 500;

    switch (status) {
      case 401: message = "Invalid credentials"; break;
      case 404: message = "Data not found"; break;
      case 500: message = "Internal Server Error"; break;
      default: message = error.response?.data?.message || error.message;
    }

    return Promise.reject({
      success: false,
      statusCode: status,
      data: null,
      message,
    });
  }
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
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

class APIClient {
  get = (url, params) => axios.get(url, { params });
  create = (url, data) => axios.post(url, data);
  update = (url, data) => axios.put(url, data);
  patch = (url, data) => axios.patch(url, data);
  delete = (url) => axios.delete(url);
}

export default new APIClient();
