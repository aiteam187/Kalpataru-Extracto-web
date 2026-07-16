import React, { useState } from "react";
import {
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  FilterX,
  Settings,
  X,
  Eye,
} from "lucide-react";
import ExportDropdown from "../common/ExportDropdown";
// ✅ FIXED: Import USER export utilities, not invoice utilities
import {
  exportUsersToExcel,
  exportUsersToPDF,
  mapUserDataForExport,
  getDateStamp,
} from "../../utils/exportUsersUtils";

const ITEMS_PER_PAGE = 10;

const UserManagementTable = ({
  employees = [],
  onEditEmployee,
  onDeleteEmployee,
  onToggleStatus,
  onViewEmployee,
  activeFilter,
  onClearFilter,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [tableFilter, setTableFilter] = useState({
    status: [],
    designation: [],
    location: [],
  });
  const [visibleColumns, setVisibleColumns] = useState({
    emp_id: true,
    employee_details: true,
    contact_info: true,
    location: true,
    designation: true,
    status: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  // Apply filters
  const getFilteredEmployees = () => {
    let filtered = [...employees];

    if (tableFilter.status.length > 0) {
      filtered = filtered.filter((e) =>
        tableFilter.status.includes(e.Status?.toLowerCase()),
      );
    }

    if (tableFilter.designation.length > 0) {
      filtered = filtered.filter((e) =>
        tableFilter.designation.includes(e.Designation?.toLowerCase()),
      );
    }

    if (tableFilter.location.length > 0) {
      filtered = filtered.filter((e) =>
        tableFilter.location.includes(e.Base_Location?.toLowerCase()),
      );
    }

    return filtered;
  };

  // Apply sorting
  const getSortedEmployees = () => {
    const filtered = getFilteredEmployees();

    if (!sortConfig.key || !sortConfig.direction) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  };

  const sortedEmployees = getSortedEmployees();
  const totalItems = sortedEmployees?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEmployees = sortedEmployees.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // ✅ FIXED: Export handlers using USER export utilities
  const handleExport = async (format = "excel") => {
    console.log(`=== 📊 TABLE ${format.toUpperCase()} EXPORT TRIGGERED ===`);

    setIsExporting(true);

    try {
      const dataToExport = sortedEmployees;

      console.log("1️⃣ Data to export:", dataToExport?.length, "employees");
      console.log("2️⃣ First employee record:", dataToExport?.[0]);

      if (!dataToExport || dataToExport.length === 0) {
        console.warn("⚠️ No data to export");
        return;
      }

      // Map the data for export
      console.log("3️⃣ Mapping employee data...");
      const mappedData = mapUserDataForExport(dataToExport);

      console.log("4️⃣ Mapped data:", mappedData?.length, "records");
      console.log("5️⃣ First mapped record:", mappedData?.[0]);

      // Generate filename
      const hasActiveFilter =
        tableFilter.status.length > 0 ||
        tableFilter.designation.length > 0 ||
        tableFilter.location.length > 0 ||
        sortConfig.key;

      const filename = hasActiveFilter
        ? `employees_filtered_${getDateStamp()}`
        : `employees_${getDateStamp()}`;

      console.log("6️⃣ Filename:", filename);

      // Export using the correct utility
      if (format === "excel") {
        console.log("7️⃣ Calling exportUsersToExcel...");
        const success = exportUsersToExcel(mappedData, filename);
        console.log("8️⃣ Export result:", success);
      } else if (format === "pdf") {
        console.log("7️⃣ Calling exportUsersToPDF...");
        const success = exportUsersToPDF(mappedData, filename);
        console.log("8️⃣ Export result:", success);
      }

      console.log(`✅ ${format.toUpperCase()} export complete`);
    } catch (error) {
      console.error(`❌ Export to ${format} failed:`, error);
      console.error("❌ Error stack:", error.stack);
    } finally {
      setIsExporting(false);
      console.log(`=== 📊 TABLE ${format.toUpperCase()} EXPORT COMPLETE ===`);
    }
  };

  const handleExportExcel = () => handleExport("excel");
  const handleExportPDF = () => handleExport("pdf");

  const hasActiveFilter =
    tableFilter.status.length > 0 ||
    tableFilter.designation.length > 0 ||
    tableFilter.location.length > 0;

  const clearAllFilters = () => {
    setTableFilter({
      status: [],
      designation: [],
      location: [],
    });
    setSortConfig({ key: null, direction: null });
    setCurrentPage(1);
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const toggleStatusFilter = (status) => {
    setTableFilter((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
    setCurrentPage(1);
  };

  const toggleDesignationFilter = (designation) => {
    setTableFilter((prev) => ({
      ...prev,
      designation: prev.designation.includes(designation)
        ? prev.designation.filter((d) => d !== designation)
        : [...prev.designation, designation],
    }));
    setCurrentPage(1);
  };

  const toggleLocationFilter = (location) => {
    setTableFilter((prev) => ({
      ...prev,
      location: prev.location.includes(location)
        ? prev.location.filter((l) => l !== location)
        : [...prev.location, location],
    }));
    setCurrentPage(1);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const isActive = status === "Active";
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
          isActive
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        }`}
      >
        {isActive ? (
          <UserCheck className="w-3 h-3" />
        ) : (
          <UserX className="w-3 h-3" />
        )}
        {status}
      </div>
    );
  };

  // Get designation badge
  const getDesignationBadge = (designation) => {
    const isAdmin = designation?.toLowerCase() === "admin";
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
          isAdmin ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-700"
        }`}
      >
        <Shield className="w-3 h-3" />
        {designation}
      </div>
    );
  };

  // ✅ FIXED: Sort Dropdown Component with proper z-index
  const SortDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    const sortOptions = [
      { key: "Emp_Id", label: "Employee ID" },
      { key: "Emp_Name", label: "Name" },
      { key: "Emp_Email", label: "Email" },
      { key: "Designation", label: "Designation" },
      { key: "Base_Location", label: "Location" },
      { key: "Status", label: "Status" },
    ];

    const getSortIcon = (key) => {
      if (sortConfig.key !== key) {
        return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
      }
      if (sortConfig.direction === "asc") {
        return <ArrowUp className="w-4 h-4 text-teal-600" />;
      }
      if (sortConfig.direction === "desc") {
        return <ArrowDown className="w-4 h-4 text-teal-600" />;
      }
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    };

    const getCurrentSortLabel = () => {
      if (!sortConfig.key || !sortConfig.direction) {
        return "Sort By";
      }
      const option = sortOptions.find((opt) => opt.key === sortConfig.key);
      const directionText = sortConfig.direction === "asc" ? "↑" : "↓";
      return `${option?.label || "Sort"} ${directionText}`;
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>{getCurrentSortLabel()}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
            />
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => {
                      handleSort(option.key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      sortConfig.key === option.key
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {getSortIcon(option.key)}
                  </button>
                ))}

                {sortConfig.key && sortConfig.direction && (
                  <>
                    <div className="h-px bg-slate-200 my-2" />
                    <button
                      onClick={() => {
                        setSortConfig({ key: null, direction: null });
                        setIsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md font-medium transition-colors"
                    >
                      Clear Sort
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ✅ FIXED: Advanced Filter Dropdown with proper z-index
  const AdvancedFilterDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    const activeFilterCount =
      tableFilter.status.length +
      tableFilter.designation.length +
      tableFilter.location.length;

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
            hasActiveFilter
              ? "bg-teal-50 border-teal-300 text-teal-700"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Filter</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-teal-600 text-white text-[10px] font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
            />
            <div
              className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-[9999] overflow-hidden max-h-[500px] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <span className="w-1 h-4 bg-emerald-500 rounded"></span>
                    Status (Multi-select)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["active", "inactive"].map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          tableFilter.status.includes(status)
                            ? "bg-teal-100 text-teal-700 border-teal-300"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tableFilter.status.includes(status) && "✓ "}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Designation Filter */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <span className="w-1 h-4 bg-blue-500 rounded"></span>
                    Designation (Multi-select)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["admin", "user", "manager", "supervisor"].map((des) => (
                      <button
                        key={des}
                        onClick={() => toggleDesignationFilter(des)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          tableFilter.designation.includes(des)
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tableFilter.designation.includes(des) && "✓ "}
                        {des.charAt(0).toUpperCase() + des.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <span className="w-1 h-4 bg-cyan-500 rounded"></span>
                    Location (Multi-select)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Chennai"].map((loc) => (
                      <button
                        key={loc}
                        onClick={() => toggleLocationFilter(loc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          tableFilter.location.includes(loc)
                            ? "bg-cyan-100 text-cyan-700 border-cyan-300"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tableFilter.location.includes(loc) && "✓ "}
                        {loc.charAt(0).toUpperCase() + loc.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilter && (
                  <>
                    <div className="h-px bg-slate-200 my-3" />
                    <button
                      onClick={() => {
                        setTableFilter({
                          status: [],
                          designation: [],
                          location: [],
                        });
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FilterX className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ✅ FIXED: Column Customization Dropdown with proper z-index
  const ColumnCustomizationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    const columns = [
      { key: "emp_id", label: "Employee ID" },
      { key: "employee_details", label: "Employee Details" },
      { key: "contact_info", label: "Contact Info" },
      { key: "location", label: "Location" },
      { key: "designation", label: "Designation" },
      { key: "status", label: "Status" },
    ];

    const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Columns</span>
          <span className="text-xs text-slate-500">
            ({visibleCount}/{columns.length})
          </span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
            />
            <div
              className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900">
                    Customize Columns
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {columns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[column.key]}
                        onChange={() => toggleColumn(column.key)}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="ml-3 text-sm text-slate-700">
                        {column.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => {
                      const allVisible = {};
                      Object.keys(visibleColumns).forEach((key) => {
                        allVisible[key] = true;
                      });
                      setVisibleColumns(allVisible);
                    }}
                    className="flex-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded text-xs font-medium hover:bg-teal-100 transition-colors"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => {
                      setVisibleColumns({
                        emp_id: true,
                        employee_details: true,
                        contact_info: false,
                        location: false,
                        designation: true,
                        status: true,
                      });
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <UserX className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          No Employees Found
        </h3>
        <p className="text-gray-500 text-sm text-center max-w-md">
          {activeFilter
            ? "No employees match the current filter. Try adjusting your filters."
            : "Get started by adding your first employee to the system."}
        </p>
        {activeFilter && (
          <button
            onClick={onClearFilter}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* SINGLE ROW - ALL CONTROLS */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/30 to-white shrink-0">
        {/* Left Side - Title + Info */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              Employee Directory
            </h2>
            <p className="text-[10px] text-gray-500">
              Real-time employee management
            </p>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold uppercase border border-teal-100">
            {totalItems} Employees
          </span>
          {activeFilter && (
            <>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-200">
                Filter:{" "}
                {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
              </span>
              <button
                onClick={onClearFilter}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold hover:bg-slate-200 transition-colors"
              >
                Clear ✕
              </button>
            </>
          )}
        </div>

        {/* Right Side - All Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="h-6 w-px bg-gray-200"></div>
          <SortDropdown />
          <AdvancedFilterDropdown />
          <ColumnCustomizationDropdown />
          {(hasActiveFilter || sortConfig.key) && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium hover:bg-rose-100 transition-all"
            >
              <FilterX className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            isLoading={isExporting}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="flex-1 overflow-auto bg-white"
        style={{ maxHeight: "500px" }}
      >
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-[100]">
            <tr>
              {visibleColumns.emp_id && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Employee ID
                </th>
              )}
              {visibleColumns.employee_details && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Employee Details
                </th>
              )}
              {visibleColumns.contact_info && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Contact Info
                </th>
              )}
              {visibleColumns.location && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
              )}
              {visibleColumns.designation && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Designation
                </th>
              )}
              {visibleColumns.status && (
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {paginatedEmployees.map((employee, index) => (
              <tr
                key={employee.Emp_Id}
                className={`hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
              >
                {/* Employee ID */}
                {visibleColumns.emp_id && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-teal-700">
                          {employee.Emp_Id?.replace("EMP", "")}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {employee.Emp_Id}
                      </span>
                    </div>
                  </td>
                )}

                {/* Employee Details */}
                {visibleColumns.employee_details && (
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {employee.Emp_Name}
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        @{employee.Username}
                      </span>
                    </div>
                  </td>
                )}

                {/* Contact Info */}
                {visibleColumns.contact_info && (
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[200px]">
                          {employee.Emp_Email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{employee.Phone_Number}</span>
                      </div>
                    </div>
                  </td>
                )}

                {/* Location */}
                {visibleColumns.location && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {employee.Base_Location}
                    </div>
                  </td>
                )}

                {/* Designation */}
                {visibleColumns.designation && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getDesignationBadge(employee.Designation)}
                  </td>
                )}

                {/* Status */}
                {visibleColumns.status && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.Status)}
                  </td>
                )}

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* View Button */}
                    <button
                      onClick={() => onViewEmployee && onViewEmployee(employee)}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                      title="View Employee"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditEmployee(employee)}
                      className="p-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition-all"
                      title="Edit Employee"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteEmployee(employee)}
                      className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t border-slate-100 bg-gradient-to-r from-white to-slate-50/50 flex items-center justify-between shrink-0">
        <div className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
            {startIndex + 1}
          </span>
          {" to "}
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
            {Math.min(endIndex, totalItems)}
          </span>
          {" of "}
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
            {totalItems}
          </span>
          {" employees"}
          {hasActiveFilter && (
            <span className="ml-2 text-teal-600 font-medium">(filtered)</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              currentPage === 1
                ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                    currentPage === pageNum
                      ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-200"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              currentPage === totalPages
                ? "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementTable;
