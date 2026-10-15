import axios from 'axios';

// ================= BASE URL =================
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🚀 [Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data
      );
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ================= TOKEN REFRESH =================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ [Response] ${response.status} ${response.config.url}`
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ================= HANDLE 401 =================
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { token, refreshToken: newRefreshToken } = res.data;

        setAuthTokens(token, newRefreshToken);
        processQueue(null, token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ================= OTHER ERRORS =================
    if (error.response) {
      console.error(
        `❌ [API Error] ${error.response.status} ${error.config?.url}`
      );

      switch (error.response.status) {
        case 403:
          console.error('🚫 Forbidden');
          break;
        case 404:
          console.error('🔍 Not Found → Check endpoint or /api prefix');
          break;
        case 500:
          console.error('💥 Server Error');
          break;
        default:
          break;
      }
    } else if (error.request) {
      console.error('📡 No response from server (network issue)');
    } else {
      console.error('⚙️ Axios setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ================= AUTH HELPERS =================
export const setAuthTokens = (token, refreshToken = null) => {
  localStorage.setItem('token', token);

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default api;