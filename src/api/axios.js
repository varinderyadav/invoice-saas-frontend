import axios from "axios";

const BASE_URL = "https://invoice-saas-api.onrender.com/api/";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAccessToken = () => localStorage.getItem("accessToken") || localStorage.getItem("access");
const getRefreshToken = () => localStorage.getItem("refreshToken") || localStorage.getItem("refresh");

const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

const setAccessToken = (token) => {
  localStorage.setItem("accessToken", token);
  localStorage.setItem("access", token);
};

let isRefreshing = false;
let requestQueue = [];

const processQueue = (error, token = null) => {
  requestQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  requestQueue = [];
};

const requestTokenRefresh = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token available.");
  }

  try {
    const response = await axios.post(`${BASE_URL}auth/refresh/`, { refresh });
    return response.data;
  } catch (firstError) {
    const response = await axios.post(`${BASE_URL}token/refresh/`, { refresh });
    return response.data;
  }
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url?.includes("auth/login/") ||
      originalRequest.url?.includes("token/") ||
      originalRequest.url?.includes("auth/refresh/") ||
      originalRequest.url?.includes("token/refresh/")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        requestQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    isRefreshing = true;

    try {
      const tokenData = await requestTokenRefresh();
      const newAccess = tokenData.access;
      const newRefresh = tokenData.refresh;

      setAccessToken(newAccess);
      if (newRefresh) {
        localStorage.setItem("refreshToken", newRefresh);
        localStorage.setItem("refresh", newRefresh);
      }

      processQueue(null, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
