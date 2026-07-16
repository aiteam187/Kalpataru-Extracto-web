import api from "./api";

const BASE_URL = "/api/usermanagement";

/**
 * User Management Service
 * Handles all API calls related to employee/user management
 */
const userManagementService = {
  /**
   * Fetch all employees
   * GET /api/usermanagement/employees
   */
  getAllEmployees: async () => {
    try {
      const response = await api.get(`${BASE_URL}/employees`);
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error fetching employees:", error);

      let errorMessage = "Failed to fetch employees";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Fetch single employee by ID
   * GET /api/usermanagement/employee/<emp_id>
   */
  getEmployeeById: async (empId) => {
    try {
      const response = await api.get(`${BASE_URL}/employee/${empId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error(`Error fetching employee ${empId}:`, error);

      let errorMessage = "Failed to fetch employee details";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Create new employee (register)
   * POST /api/usermanagement/register
   */
  createEmployee: async (employeeData) => {
    try {
      // Convert 'Inactive' to 'Deactive' before sending to backend
      const dataToSend = { ...employeeData };
      if (dataToSend.Status === "Inactive") {
        dataToSend.Status = "Deactive";
      }

      console.log("📤 BEFORE BACKEND - Status:", dataToSend.Status);
      console.log("📦 Full payload:", dataToSend);

      const response = await api.post(`${BASE_URL}/register`, dataToSend);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "Employee created successfully",
      };
    } catch (error) {
      console.error("Error creating employee:", error);

      // Extract error message from nested response structure
      let errorMessage = "Failed to create employee";

      if (error.response?.data?.detail?.message) {
        // Handle nested detail.message structure
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        // Handle direct message structure
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Fallback to error.message
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Update employee details
   * PUT /api/usermanagement/employee/<emp_id>
   */
  updateEmployee: async (empId, employeeData) => {
    try {
      // Convert 'Inactive' to 'Deactive' before sending to backend
      const dataToSend = { ...employeeData };
      if (dataToSend.Status === "Inactive") {
        dataToSend.Status = "Deactive";
      }

      const response = await api.put(
        `${BASE_URL}/employee/${empId}`,
        dataToSend,
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "Employee updated successfully",
      };
    } catch (error) {
      console.error(`Error updating employee ${empId}:`, error);

      // Extract error message from nested response structure
      let errorMessage = "Failed to update employee";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Delete employee
   * DELETE /api/usermanagement/employee/<emp_id>
   */
  deleteEmployee: async (empId) => {
    try {
      const response = await api.delete(`${BASE_URL}/employee/${empId}`);
      return {
        success: true,
        message: response.data.message || "Employee deleted successfully",
      };
    } catch (error) {
      console.error(`Error deleting employee ${empId}:`, error);

      let errorMessage = "Failed to delete employee";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Toggle employee status (activate/deactivate)
   * This handles both activation and deactivation based on current status
   */
  toggleEmployeeStatus: async (empId, currentStatus) => {
    try {
      // If current status is "Active", deactivate. Otherwise, activate.
      const endpoint = currentStatus === "Active" ? "deactivate" : "activate";
      const response = await api.post(
        `${BASE_URL}/employee/${empId}/${endpoint}`,
      );

      return {
        success: true,
        newStatus: currentStatus === "Active" ? "Inactive" : "Active",
        message: response.data.message || `Employee ${endpoint}d successfully`,
      };
    } catch (error) {
      console.error(`Error toggling status for employee ${empId}:`, error);

      let errorMessage = "Failed to toggle employee status";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Activate employee
   * POST /api/usermanagement/employee/<emp_id>/activate
   */
  activateEmployee: async (empId) => {
    try {
      const response = await api.post(`${BASE_URL}/employee/${empId}/activate`);
      return {
        success: true,
        message: response.data.message || "Employee activated successfully",
      };
    } catch (error) {
      console.error(`Error activating employee ${empId}:`, error);

      let errorMessage = "Failed to activate employee";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Deactivate employee
   * POST /api/usermanagement/employee/<emp_id>/deactivate
   */
  deactivateEmployee: async (empId) => {
    try {
      const response = await api.post(
        `${BASE_URL}/employee/${empId}/deactivate`,
      );
      return {
        success: true,
        message: response.data.message || "Employee deactivated successfully",
      };
    } catch (error) {
      console.error(`Error deactivating employee ${empId}:`, error);

      let errorMessage = "Failed to deactivate employee";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Search employees
   * GET /api/usermanagement/search?name=...&email=...
   */
  searchEmployees: async (filters) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`${BASE_URL}/search?${params}`);
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error searching employees:", error);

      let errorMessage = "Failed to search employees";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Login
   * POST /api/usermanagement/login
   */
  login: async (identifier, password) => {
    try {
      const response = await api.post(`${BASE_URL}/login`, {
        identifier,
        password,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Error logging in:", error);

      let errorMessage = "Login failed";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Change password
   * POST /api/usermanagement/change-password
   */
  changePassword: async (empId, phoneNumber, newPassword) => {
    try {
      const response = await api.post(`${BASE_URL}/change-password`, {
        emp_id: empId,
        phone_number: phoneNumber,
        new_password: newPassword,
      });
      return {
        success: true,
        message: response.data.message || "Password changed successfully",
      };
    } catch (error) {
      console.error("Error changing password:", error);

      let errorMessage = "Failed to change password";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Forgot password
   * POST /api/usermanagement/forgot-password
   */
  forgotPassword: async (email, otp, newPassword, confirmPassword) => {
    try {
      const response = await api.post(`${BASE_URL}/forgot-password`, {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return {
        success: true,
        message: response.data.message || "Password reset successfully",
      };
    } catch (error) {
      console.error("Error resetting password:", error);

      let errorMessage = "Failed to reset password";

      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },
};

export default userManagementService;
