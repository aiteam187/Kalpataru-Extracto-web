import React, { useState, useEffect } from "react";
import UserManagementStats from "../components/userManagement/UserManagementStats";
import UserManagementTable from "../components/userManagement/UserManagementTable";
import UserManagementEditModal from "../components/userManagement/UserManagementEditModal";
import UserManagementAddModal from "../components/userManagement/UserManagementAddModal";
import UserManagementViewModal from "../components/userManagement/UserManagementViewModal";
import ConfirmDeleteDialog from "../components/userManagement/ConfirmDeleteDialog";
import Loading from "../components/common/Loading";
import ExportDropdown from "../components/common/ExportDropdown";
import useUserManagement from "../hooks/useUserManagement";
import { useAppContext } from "../context/AppContext";
import { Search, RefreshCw, Users, UserPlus } from "lucide-react";
import {
  exportUsersToExcel,
  exportUsersToPDF,
  mapUserDataForExport,
  getDateStamp,
} from "../utils/exportUsersUtils";

const UserManagement = () => {
  const { showNotification } = useAppContext();

  const {
    employees,
    stats,
    loading,
    error,
    refresh,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
  } = useUserManagement({ autoFetch: true });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const coloredStats =
    stats?.map((stat) => {
      const label = stat.label?.toUpperCase() || "";
      let color = "slate";
      let filterKey = null;

      if (label.includes("TOTAL")) {
        color = "slate";
        filterKey = "total";
      } else if (label.includes("INACTIVE")) {
        color = "rose";
        filterKey = "inactive";
      } else if (label.includes("ACTIVE")) {
        color = "emerald";
        filterKey = "active";
      } else if (label.includes("ADMIN")) {
        color = "amber";
        filterKey = "admin";
      } else if (label.includes("REGULAR") || label.includes("USER")) {
        color = "blue";
        filterKey = "user";
      } else if (label.includes("LOCATION")) {
        color = "cyan";
        filterKey = "location";
      }

      return {
        ...stat,
        color,
        filterKey,
        isActive: activeFilter !== null && activeFilter === filterKey,
        onClick: () => {
          if (filterKey === "total" || filterKey === "location") {
            setActiveFilter(null);
          } else if (filterKey) {
            setActiveFilter(activeFilter === filterKey ? null : filterKey);
          }
        },
      };
    }) || [];

  useEffect(() => {
    if (activeFilter) {
      setTimeout(() => {
        document.querySelector(".employee-table-section")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [activeFilter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("employee-search")?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setAddModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRefresh = async () => {
    await refresh();
    showNotification("Employee data refreshed", "success");
  };

  const handleAddEmployee = async (employeeData) => {
    const result = await createEmployee(employeeData);

    if (result.success) {
      showNotification("Employee added successfully", "success");
    } else {
      showNotification(result.message || "Failed to add employee", "error");
    }
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setViewModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (empId, updatedData) => {
    const result = await updateEmployee(empId, updatedData);

    if (result.success) {
      showNotification("Employee updated successfully", "success");
      setEditModalOpen(false);
      setSelectedEmployee(null);
    } else {
      showNotification(result.message || "Failed to update employee", "error");
    }
  };

  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;

    setDeleting(true);

    const result = await deleteEmployee(selectedEmployee.Emp_Id);

    if (result.success) {
      showNotification("Employee deleted successfully", "success");
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    } else {
      showNotification(result.message || "Failed to delete employee", "error");
    }

    setDeleting(false);
  };

  const handleToggleStatus = async (empId, currentStatus) => {
    const result = await toggleEmployeeStatus(empId, currentStatus);

    if (result.success) {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      showNotification(`Employee ${newStatus.toLowerCase()}`, "success");
    } else {
      showNotification(result.message || "Failed to update status", "error");
    }
  };

  const searchFilteredEmployees = searchQuery
    ? employees.filter(
        (emp) =>
          emp.Emp_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.Emp_Id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.Emp_Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.Username?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : employees;

  const filteredEmployees = activeFilter
    ? searchFilteredEmployees.filter((emp) => {
        if (activeFilter === "active") return emp.Status === "Active";
        if (activeFilter === "inactive") return emp.Status === "Inactive";
        if (activeFilter === "admin")
          return emp.Designation?.toLowerCase() === "admin";
        if (activeFilter === "user")
          return emp.Designation?.toLowerCase() === "user";
        return true;
      })
    : searchFilteredEmployees;

  const handleExportExcel = () => {
    const dataToExport =
      filteredEmployees.length > 0 ? filteredEmployees : employees;

    if (!dataToExport || dataToExport.length === 0) {
      showNotification("No users to export", "warning");
      return;
    }

    setIsExporting(true);

    try {
      const exportData = mapUserDataForExport(dataToExport);

      if (!exportData || exportData.length === 0) {
        showNotification("Failed to prepare export data", "error");
        return;
      }

      let filenamePrefix = "all_users";
      if (searchQuery) {
        filenamePrefix = "searched_users";
      } else if (activeFilter) {
        filenamePrefix = `${activeFilter}_users`;
      }

      const filename = `${filenamePrefix}_${getDateStamp()}`;
      const success = exportUsersToExcel(exportData, filename);

      if (success) {
        showNotification(
          `Exported ${exportData.length} users to Excel`,
          "success",
        );
      } else {
        showNotification("Export failed", "error");
      }
    } catch (error) {
      showNotification(`Failed to export: ${error.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    const dataToExport =
      filteredEmployees.length > 0 ? filteredEmployees : employees;

    if (!dataToExport || dataToExport.length === 0) {
      showNotification("No users to export", "warning");
      return;
    }

    setIsExporting(true);

    try {
      const exportData = mapUserDataForExport(dataToExport);

      if (!exportData || exportData.length === 0) {
        showNotification("Failed to prepare export data", "error");
        return;
      }

      let filenamePrefix = "all_users";
      if (searchQuery) {
        filenamePrefix = "searched_users";
      } else if (activeFilter) {
        filenamePrefix = `${activeFilter}_users`;
      }

      const filename = `${filenamePrefix}_${getDateStamp()}`;
      const success = exportUsersToPDF(exportData, filename);

      if (success) {
        showNotification(
          `Exported ${exportData.length} users to PDF`,
          "success",
        );
      } else {
        showNotification("Export failed", "error");
      }
    } catch (error) {
      showNotification(`Failed to export: ${error.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && employees.length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm mt-10">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
          !
        </div>
        <h3 className="text-lg font-bold text-gray-900">System Error</h3>
        <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
          {error}
        </p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="animate-in fade-in duration-500 space-y-5">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-none">
                  User Management
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Manage employees and user accounts
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="employee-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full md:w-[260px] transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:block">
                  <kbd className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">
                    ⌘K
                  </kbd>
                </div>
              </div>

              <div className="h-8 w-px bg-gray-200 mx-1 hidden lg:block" />

              <ExportDropdown
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                isLoading={isExporting}
              />

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <UserManagementStats stats={coloredStats} loading={loading} />

        {/* ✅ FIXED: Table with overflow visible */}
        <div
          className="employee-table-section bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col"
          style={{ overflow: "visible" }}
        >
          <UserManagementTable
            employees={filteredEmployees}
            onViewEmployee={handleViewEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onToggleStatus={handleToggleStatus}
            activeFilter={activeFilter}
            onClearFilter={() => setActiveFilter(null)}
          />
        </div>

        {activeFilter && (
          <div className="text-center py-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-slate-700">
              Showing{" "}
              <span className="font-bold text-blue-600">
                {filteredEmployees.length}
              </span>{" "}
              of <span className="font-bold">{employees.length}</span> total
              employees
            </p>
          </div>
        )}
      </div>

      <UserManagementViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />

      <UserManagementEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onSave={handleSaveEdit}
      />

      <UserManagementAddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddEmployee}
      />

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This will permanently remove their account and all associated data."
        employeeName={`${selectedEmployee?.Emp_Name} (${selectedEmployee?.Emp_Id})`}
        loading={deleting}
      />
    </>
  );
};

export default UserManagement;
