import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("[API] API URL:", API_URL);

// Create the axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CRITICAL: If sending FormData, let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
      hasAuth: !!token,
      isFormData: config.data instanceof FormData,
    });

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("[API] Unauthorized - clearing session");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Support BOTH import styles
export { api };
export default api;