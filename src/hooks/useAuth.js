import { useState } from "react";
import { STORAGE_KEYS } from "../utils/constants";

/**
 * Custom hook for authentication
 * @returns {Object}
 */
const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>}
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await api.post('/auth/login', credentials);

      // Mock login
      const mockResponse = {
        token: "mock-jwt-token",
        user: {
          name: "Shri",
          role: "Admin",
          email: credentials.email,
        },
      };

      // Store token and user data
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockResponse.token);
      localStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(mockResponse.user)
      );

      return mockResponse;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    window.location.href = "/login";
  };

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = () => {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  };

  /**
   * Get current user
   * @returns {Object|null}
   */
  const getCurrentUser = () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  };

  return {
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    getCurrentUser,
  };
};

export default useAuth;
