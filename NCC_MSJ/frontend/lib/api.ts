// lib/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 second timeout
});

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      // Check if response is HTML (common when hitting wrong endpoint)
      if (typeof data === 'string' && data.startsWith('<!DOCTYPE')) {
        console.error('Received HTML instead of JSON. Check if your backend is running and API_URL is correct.');
        return Promise.reject({
          ...error,
          message: 'Backend server not responding. Please check if the server is running.',
          isConnectionError: true
        });
      }
      
      return Promise.reject(error);
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server. Is your backend running?');
      return Promise.reject({
        ...error,
        message: 'Cannot connect to server. Please ensure the backend is running.',
        isConnectionError: true
      });
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

export default API;