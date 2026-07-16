// src\web\services\api.js
import axios from "axios";
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from "../utils/constants";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ ADD: User info headers for approval tracking
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("👤 User object from localStorage:", user); // Debug

        // Try multiple possible field names (case-insensitive)
        const userName =
          user.emp_name ||
          user.Emp_Name ||
          user.name ||
          user.Name ||
          user.username ||
          user.userName ||
          user.UserName ||
          user.employee_name ||
          user.Employee_Name ||
          "Unknown";

        const userId =
          user.emp_id ||
          user.Emp_ID ||
          user.id ||
          user.ID ||
          user.empId ||
          user.EmpId ||
          user.employee_id ||
          user.Employee_ID ||
          "";

        config.headers["X-User-Name"] = userName;
        config.headers["X-User-Id"] = userId;

        console.log("📤 User headers being sent:", {
          "X-User-Name": userName,
          "X-User-Id": userId,
        });
      } catch (e) {
        console.error("❌ Failed to parse user data:", e);
      }
    } else {
      console.warn("⚠️ No user data found in localStorage");
      console.log("📦 All localStorage keys:", Object.keys(localStorage));
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log("🚀 API Request:", config.method.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log("✅ API Response:", response.config.url, response.data);
    }
    // ✅ FIX: Return the full response object, not just response.data
    // This allows invoiceService to access both response.data and handle errors
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          window.location.href = "/login";
          break;
        case 403:
          console.error("❌ Forbidden:", data?.message);
          break;
        case 404:
          // ✅ FIX: Don't log 404 as error - it's expected for /master/stats
          console.log("ℹ️ Not Found (404):", error.config.url);
          break;
        case 500:
          console.error("❌ Server Error:", data?.message);
          break;
        default:
          console.error("❌ API Error:", data?.message || error.message);
      }
    } else if (error.request) {
      console.error("❌ Network Error: No response received");
    } else {
      console.error("❌ Error:", error.message);
    }

    // ✅ FIX: Always reject to allow service layer to catch and handle
    return Promise.reject(error);
  },
);

export default api;
