// src/services/authService.js

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api/usermanagement`
  : "http://192.168.10.113:8000/api/usermanagement";

class AuthService {
  /**
   * Login user
   */
  async login(identifier, password) {
    // Hardcoded bypass credentials
    if (
      identifier.trim().toLowerCase() === "admin@gmail.com" &&
      password === "Admin@123"
    ) {
      const user = { name: "Admin", role: "Admin", email: "admin@gmail.com" };
      this.setUser(user);
      return { success: true, data: { employee: user }, message: "Login successful" };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ✅ Show the actual backend message
        const errorMessage =
          data.message || data.detail?.message || "Login failed";

        if (response.status === 401) {
          throw new Error(errorMessage); // Will show "Employee not found" or "Incorrect password"
        } else if (response.status === 403) {
          throw new Error(errorMessage);
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later");
        }
        throw new Error(errorMessage);
      }
      // Store user data in localStorage
      if (data.success && data.data?.employee) {
        this.setUser(data.data.employee);
      }

      return {
        success: true,
        data: data.data,
        message: data.message || "Login successful",
      };
    } catch (error) {
      console.error("Login error:", error);

      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        throw new Error("Network error. Please check your connection");
      }

      throw error;
    }
  }

  /**
   * Store user data
   */
  setUser(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
  }

  /**
   * Get stored user data
   */
  getUser() {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const isAuth = localStorage.getItem("isAuthenticated") === "true";
    const user = localStorage.getItem("user");

    // Both must exist for valid authentication
    return isAuth && user !== null;
  }

  /**
   * Logout user - Clear all auth data
   */
  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.clear(); // Clear everything to be safe
  }
}

export default new AuthService();
