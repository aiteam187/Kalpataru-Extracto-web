import React, { useState, useRef, useEffect } from "react";
import DataTable from "../common/DataTable";
import ExportDropdown from "../common/ExportDropdown";
import DashboardActionButton from "./DashboardActionButton";
import DashboardViewModal from "./DashboardViewModal";
import DashboardEditModal from "./DashboardEditModal";
import ConfirmDialog from "./ConfirmDialog";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  FilterX,
  Settings,
  Calendar,
  DollarSign,
  X,
} from "lucide-react";
import invoiceService from "../../services/invoiceService";

const ITEMS_PER_PAGE = 25;

// ==========================================
// SORT DROPDOWN
// ==========================================

const SortDropdown = ({ sortConfig, onSort }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const sortOptions = [
    { key: "ID", label: "ID" },
    { key: "project_site", label: "Project Site" }, // ← was vendor_name / Issuer
    { key: "vendor_name", label: "Vendor Name" },
    { key: "destination_site", label: "Destination" }, // ← new
    { key: "invoice_number", label: "Document No." },
    { key: "invoice_date", label: "Date" },
    { key: "vehicle_number", label: "Vehicle No." },
    { key: "approval_status", label: "Status" },
    { key: "inward_outward", label: "Direction" },
  ];

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    if (sortConfig.direction === "asc")
      return <ArrowUp className="w-4 h-4 text-teal-600" />;
    if (sortConfig.direction === "desc")
      return <ArrowDown className="w-4 h-4 text-teal-600" />;
    return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
  };

  const getCurrentSortLabel = () => {
    if (!sortConfig.key || !sortConfig.direction) return "Sort By";
    const option = sortOptions.find((opt) => opt.key === sortConfig.key);
    return `${option?.label || "Sort"} ${sortConfig.direction === "asc" ? "↑" : "↓"}`;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>{getCurrentSortLabel()}</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden"
          style={{ zIndex: 99999 }}
        >
          <div className="p-2">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onSort(option.key);
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
                    onSort(null);
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
      )}
    </div>
  );
};

// ==========================================
// ADVANCED FILTER DROPDOWN
// ==========================================

const AdvancedFilterDropdown = ({
  tableFilter,
  setTableFilter,
  setCurrentPage,
  hasActiveFilter,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleStatusFilter = (status) => {
    setTableFilter((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
    setCurrentPage(1);
  };

  const toggleTypeFilter = (type) => {
    setTableFilter((prev) => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter((t) => t !== type)
        : [...prev.type, type],
    }));
    setCurrentPage(1);
  };

  const activeFilterCount =
    tableFilter.status.length +
    tableFilter.type.length +
    (tableFilter.dateFrom ? 1 : 0) +
    (tableFilter.dateTo ? 1 : 0) +
    (tableFilter.amountMin ? 1 : 0) +
    (tableFilter.amountMax ? 1 : 0);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
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
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-[500px] overflow-y-auto"
          style={{ zIndex: 99999, position: "absolute" }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Filters</h3>
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
                {["approve", "reject", "pending"].map((status) => (
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

            {/* Type Filter */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <span className="w-1 h-4 bg-blue-500 rounded"></span>
                Type (Multi-select)
              </p>
              <div className="flex flex-wrap gap-2">
                {["inward", "outward"].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      tableFilter.type.includes(type)
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tableFilter.type.includes(type) && "✓ "}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date Range
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-500">From</label>
                  <input
                    type="date"
                    value={tableFilter.dateFrom}
                    onChange={(e) => {
                      setTableFilter((prev) => ({
                        ...prev,
                        dateFrom: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">To</label>
                  <input
                    type="date"
                    value={tableFilter.dateTo}
                    onChange={(e) => {
                      setTableFilter((prev) => ({
                        ...prev,
                        dateTo: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Amount Range */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Amount Range (₹)
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500">Min</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={tableFilter.amountMin}
                    onChange={(e) => {
                      setTableFilter((prev) => ({
                        ...prev,
                        amountMin: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500">Max</label>
                  <input
                    type="number"
                    placeholder="999999"
                    value={tableFilter.amountMax}
                    onChange={(e) => {
                      setTableFilter((prev) => ({
                        ...prev,
                        amountMax: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilter && (
              <>
                <div className="h-px bg-slate-200 my-3" />
                <button
                  onClick={() => {
                    onClearFilters();
                    setIsOpen(false);
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
      )}
    </div>
  );
};

// ==========================================
// COLUMN CUSTOMIZATION DROPDOWN
// ==========================================

const ColumnCustomizationDropdown = ({
  visibleColumns,
  setVisibleColumns,
  toggleColumn,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const columns = [
    { key: "id", label: "ID" },
    { key: "project_site", label: "Project Site" }, // ← was vendor_name / Issuer
    { key: "vendor_name", label: "Vendor Name" },
    { key: "destination_site", label: "Destination" }, // ← new
    { key: "invoice_number", label: "Document No." },
    { key: "invoice_date", label: "Date" },
    { key: "vehicle_number", label: "Vehicle No." },
    { key: "approval_status", label: "Status" },
    { key: "inward_outward", label: "Direction" },
    { key: "document_type", label: "Doc Type" },
  ];

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
      >
        <Settings className="w-4 h-4" />
        <span>Columns</span>
        <span className="text-xs text-slate-500">
          ({visibleCount}/{columns.length})
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden"
          style={{ zIndex: 99999 }}
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
                    checked={visibleColumns[column.key] ?? false}
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
                  columns.forEach(({ key }) => {
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
                    id: true,
                    project_site: true, // ← was vendor_name
                    vendor_name: true,
                    vehicle_number: true,
                    approval_status: true,
                    destination_site: false,
                    invoice_number: false,
                    invoice_date: false,
                    inward_outward: false,
                    document_type: false,
                  });
                }}
                className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const DashboardTable = ({
  records,
  onBlockVendor,
  onUnblockVendor,
  onDeleteRecord,
  onEditRecord,
  showNotification,
  activeFilter,
  onClearFilter,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [localRecords, setLocalRecords] = useState(records);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [entryTypeTab, setEntryTypeTabState] = useState(
    () => localStorage.getItem("dashboard_entry_type_tab") || "automatic",
  );
  const setEntryTypeTab = (tab) => {
    setEntryTypeTabState(tab);
    localStorage.setItem("dashboard_entry_type_tab", tab);
  };

  const [tableFilter, setTableFilter] = useState({
    status: [],
    type: [],
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });

  // ← project_site replaces vendor_name; destination_site added
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    project_site: true,
    vendor_name: true,
    destination_site: false,
    invoice_number: true,
    invoice_date: true,
    vehicle_number: false,
    approval_status: true,
    inward_outward: true,
    document_type: true,
  });

  const [viewModal, setViewModal] = useState({ isOpen: false, recordId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, record: null });
  const [dialog, setDialog] = useState({
    isOpen: false,
    record: null,
    isLoading: false,
  });

  React.useEffect(() => {
    const sortedRecords = [...records].sort((a, b) => {
      const aDate = new Date(
        a.updated_at || a.action_date || a.Action_Date || a.invoice_date || 0,
      );
      const bDate = new Date(
        b.updated_at || b.action_date || b.Action_Date || b.invoice_date || 0,
      );
      return bDate - aDate;
    });
    setLocalRecords(sortedRecords);
  }, [records]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [entryTypeTab]);

  // Records are filtered by entryTypeTab below (independent of activeFilter),
  // so clicking the "Manual" stats card set activeFilter="manual" but never
  // actually switched the Automatic/Manual toggle — the table stayed on
  // "automatic" and showed nothing. Sync the toggle to whichever dataset the
  // clicked stat card actually belongs to.
  React.useEffect(() => {
    if (activeFilter === "manual" && entryTypeTab !== "manual") {
      setEntryTypeTab("manual");
    } else if (activeFilter && activeFilter !== "manual" && entryTypeTab !== "automatic") {
      setEntryTypeTab("automatic");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const handleSort = (key) => {
    if (key === null) {
      setSortConfig({ key: null, direction: null });
      return;
    }
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") {
        setSortConfig({ key: null, direction: null });
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const getFilteredRecords = () => {
    let filtered = [...localRecords].filter(
      (r) => (r.entry_type || "automatic") === entryTypeTab,
    );
    if (tableFilter.status.length > 0)
      filtered = filtered.filter((r) =>
        tableFilter.status.includes(r.approval_status?.toLowerCase()),
      );
    if (tableFilter.type.length > 0)
      filtered = filtered.filter((r) =>
        tableFilter.type.includes(r.inward_outward?.toLowerCase()),
      );
    if (tableFilter.dateFrom)
      filtered = filtered.filter(
        (r) => new Date(r.invoice_date) >= new Date(tableFilter.dateFrom),
      );
    if (tableFilter.dateTo)
      filtered = filtered.filter(
        (r) => new Date(r.invoice_date) <= new Date(tableFilter.dateTo),
      );
    if (tableFilter.amountMin)
      filtered = filtered.filter(
        (r) =>
          (parseFloat(r.invoice_amount) || 0) >=
          parseFloat(tableFilter.amountMin),
      );
    if (tableFilter.amountMax)
      filtered = filtered.filter(
        (r) =>
          (parseFloat(r.invoice_amount) || 0) <=
          parseFloat(tableFilter.amountMax),
      );
    return filtered;
  };

  const getSortedRecords = () => {
    const filtered = getFilteredRecords();
    if (!sortConfig.key || !sortConfig.direction) {
      return [...filtered].sort((a, b) => {
        const aDate = new Date(
          a.updated_at || a.action_date || a.Action_Date || a.invoice_date || 0,
        );
        const bDate = new Date(
          b.updated_at || b.action_date || b.Action_Date || b.invoice_date || 0,
        );
        return bDate - aDate;
      });
    }
    return [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (sortConfig.key === "invoice_amount") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortConfig.key === "invoice_date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedRecords = getSortedRecords();
  const totalItems = sortedRecords?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  // ── Fixed, clean export layout ───────────────────────────────────────────
  // One row PER DOCUMENT. All items for that document go into a single
  // "Items & Description" cell, listed one after another (line by line).
  const fmt = (v) => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      return new Date(v).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    }
    return String(v);
  };

  // Builds a single multi-line cell like:
  // 1) PCC paver blocks - 80mm heavy duty — Qty: 200
  // 2) Aluminum Formwork panels - wall system — Qty: 30
  const formatItemsList = (items) => {
    if (!Array.isArray(items) || items.length === 0) return "-";
    return items
      .map((it, i) => {
        const srNo = it?.sr_no ? String(it.sr_no).replace(/[).]+$/, "") : i + 1;
        const desc = it?.description || "-";
        const qty = it?.quantity ? `Qty: ${it.quantity}` : "";
        const unit = it?.unit ? ` ${it.unit}` : "";
        return `${srNo}) ${desc}${qty ? " — " + qty + unit : ""}`;
      })
      .join("\n");
  };

  const mapRawDataForExport = (data) => {
    if (!data || data.length === 0) return [];

    return data.map((item, idx) => {
      const ex = item.extracted_data || item.raw?.extracted_data || {};
      const items = Array.isArray(ex.items) ? ex.items : [];
      const sig = ex.signatures || {};
      const issuer = ex.issuer_details || {};
      const person = ex.person_details || {};
      const meta = ex.document_metadata || {};
      const srcDst = ex.source_destination || {};
      const transporter = ex.transporter_details || {};

      return {
        "Sr No": idx + 1,
        Direction: fmt(item.inward_outward),
        "Document Type": fmt(item.document_type),
        "Document No": fmt(item.invoice_number),
        Date: item.invoice_date
          ? new Date(item.invoice_date).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })
          : "-",
        Status: fmt(item.approval_status),
        "Items & Description": formatItemsList(items),

        "signatures - security_no": fmt(sig.security_no),
        "signatures - contractor_date": fmt(sig.contractor_date),
        "signatures - contractor_name": fmt(sig.contractor_name),
        "signatures - authorized_company": fmt(sig.authorized_company),
        "signatures - company_staff_date": fmt(sig.company_staff_date),
        "signatures - company_staff_name": fmt(sig.company_staff_name),
        "signatures - person_taking_out_material": fmt(
          sig.person_taking_out_material,
        ),

        "issuer_details - address": fmt(issuer.address),
        "issuer_details - company_name_printed_on_the_letterhead": fmt(
          issuer.company_name_printed_on_the_letterhead,
        ),

        "person_details - at_m_s_company_name": fmt(person.at_m_s_company_name),
        "person_details - please_allow_shri_name": fmt(
          person.please_allow_shri_name,
        ),
        "person_details - material_belongs_to_site": fmt(
          person.material_belongs_to_site,
        ),
        "person_details - destination_of_material_site": fmt(
          person.destination_of_material_site,
        ),

        "document_metadata - date": fmt(meta.date),
        "document_metadata - mtn_number": fmt(meta.mtn_number),
        "document_metadata - form_number": fmt(meta.form_number),
        "document_metadata - project_site": fmt(meta.project_site),
        "document_metadata - document_type": fmt(meta.document_type),
        "document_metadata - applicable_sop": fmt(meta.applicable_sop),

        "source_destination - remarks": fmt(srcDst.remarks),
        "source_destination - source_site": fmt(srcDst.source_site),
        "source_destination - destination_site": fmt(srcDst.destination_site),
        "source_destination - reason_for_transfer": fmt(
          srcDst.reason_for_transfer,
        ),

        "transporter_details - transport_date": fmt(transporter.transport_date),
        "transporter_details - vehicle_number": fmt(transporter.vehicle_number),
      };
    });
  };

  const handleExport = async (format = "excel") => {
    setIsExporting(true);
    try {
      if (!sortedRecords?.length) {
        if (showNotification)
          showNotification("No data available to export", "warning");
        return;
      }
      const mappedData = mapRawDataForExport(sortedRecords);
      const timestamp = new Date().toISOString().split("T")[0];
      const hasFilter =
        tableFilter.status.length > 0 ||
        tableFilter.type.length > 0 ||
        tableFilter.dateFrom ||
        tableFilter.dateTo ||
        tableFilter.amountMin ||
        tableFilter.amountMax ||
        sortConfig.key;
      const filename = hasFilter
        ? `gate_pass_export_filtered_${timestamp}`
        : `gate_pass_export_${timestamp}`;
      if (format === "excel") {
        exportToExcel(mappedData, filename);
        if (showNotification)
          showNotification(
            `Exported ${mappedData.length} records to Excel`,
            "success",
          );
      } else if (format === "pdf") {
        exportToPDF(mappedData, filename);
        if (showNotification)
          showNotification(
            `Exported ${mappedData.length} records to PDF`,
            "success",
          );
      }
    } catch (error) {
      console.error(`Export failed:`, error);
      if (showNotification) showNotification("Export failed.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => handleExport("excel");
  const handleExportPDF = () => handleExport("pdf");

  const handleViewDetails = (record) =>
    setViewModal({ isOpen: true, recordId: record.ID || record.id });
  const handleCloseViewModal = () =>
    setViewModal({ isOpen: false, recordId: null });

  const handleEdit = (record) => {
    if (isUpdating) return;
    if (editModal.isOpen) {
      setEditModal({ isOpen: false, record: null });
      setTimeout(() => setEditModal({ isOpen: true, record }), 100);
      return;
    }
    setEditModal({ isOpen: true, record });
  };

  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, record: null });
    setTimeout(() => setIsUpdating(false), 150);
  };

  const handleSaveEdit = async () => {
    if (onDeleteRecord) onDeleteRecord();
    if (showNotification)
      showNotification("Record updated successfully!", "success");
  };

  const handleDeleteClick = (record) => {
    if (isUpdating) return;
    setDialog({ isOpen: true, record, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    const { record } = dialog;
    const recordId = record.ID || record.id;
    const previousRecords = [...localRecords];
    setDialog((prev) => ({ ...prev, isLoading: true }));
    setIsUpdating(true);
    setLocalRecords((prev) => prev.filter((r) => (r.ID || r.id) !== recordId));
    try {
      await invoiceService.deleteRecord(recordId);
      if (onDeleteRecord) onDeleteRecord(record);
      setDialog({ isOpen: false, record: null, isLoading: false });
      if (showNotification)
        showNotification("Record deleted successfully", "success");
    } catch (error) {
      setLocalRecords(previousRecords);
      setDialog((prev) => ({ ...prev, isLoading: false }));
      if (showNotification)
        showNotification("Failed to delete record.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const hasActiveFilter =
    tableFilter.status.length > 0 ||
    tableFilter.type.length > 0 ||
    tableFilter.dateFrom ||
    tableFilter.dateTo ||
    tableFilter.amountMin ||
    tableFilter.amountMax;

  const clearAllFilters = () => {
    setTableFilter({
      status: [],
      type: [],
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
    });
    setSortConfig({ key: null, direction: null });
    setCurrentPage(1);
  };

  const toggleColumn = (columnKey) =>
    setVisibleColumns((prev) => ({ ...prev, [columnKey]: !prev[columnKey] }));

  return (
    <div className="flex flex-col w-full h-full">
      {/* Controls Row */}
      <div
        className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-slate-50/30 to-white shrink-0"
        style={{ position: "relative", zIndex: 100 }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              Data Status
            </h2>
            <p className="text-[10px] text-gray-500">
              Real-time gate pass monitoring
            </p>
          </div>
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold uppercase border border-teal-100">
            {totalItems} Records
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

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-300 rounded-lg">
            {["automatic", "manual"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  // The parent's stat-card filter (activeFilter) already narrows
                  // `records` down to one entry_type before it reaches this table.
                  // Switching this tab to the *other* entry_type on top of that
                  // narrowed list always yields zero rows, so clear the stat-card
                  // filter whenever it conflicts with the tab the user just picked.
                  const conflictsWithActiveFilter =
                    (t === "manual" && activeFilter && activeFilter !== "manual") ||
                    (t === "automatic" && activeFilter === "manual");
                  if (conflictsWithActiveFilter && onClearFilter) onClearFilter();
                  setEntryTypeTab(t);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  entryTypeTab === t
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t === "automatic" ? "Automatic" : "Manual"}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <SortDropdown sortConfig={sortConfig} onSort={handleSort} />
          <AdvancedFilterDropdown
            tableFilter={tableFilter}
            setTableFilter={setTableFilter}
            setCurrentPage={setCurrentPage}
            hasActiveFilter={hasActiveFilter}
            onClearFilters={clearAllFilters}
          />
          <ColumnCustomizationDropdown
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            toggleColumn={toggleColumn}
          />
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
        className="flex-1 bg-white"
        style={{
          maxHeight: "500px",
          overflow: "auto",
          position: "relative",
          zIndex: 10,
        }}
      >
        <DataTable
          data={paginatedRecords}
          visibleColumns={visibleColumns}
          simple={entryTypeTab === "manual"}
          srStart={totalItems - startIndex}
          onRowClick={handleViewDetails}
          renderAction={(record) => (
            <DashboardActionButton
              record={record}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isDisabled={isUpdating}
            />
          )}
        />
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
          {" records"}
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
              if (totalPages <= 5) pageNum = idx + 1;
              else if (currentPage <= 3) pageNum = idx + 1;
              else if (currentPage >= totalPages - 2)
                pageNum = totalPages - 4 + idx;
              else pageNum = currentPage - 2 + idx;
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

      {/* Modals */}
      <ConfirmDialog
        isOpen={dialog.isOpen}
        title="Delete Record?"
        message={
          dialog.record?.entry_type === "manual"
            ? `Are you sure you want to delete this manual entry?\n\nDocument #: ${dialog.record?.invoice_number}\n\nThis action cannot be undone.`
            : `Are you sure you want to delete this record?\n\nProject Site: ${dialog.record?.project_site}\nDocument #: ${dialog.record?.invoice_number}\n\nThis action cannot be undone.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDialog({ isOpen: false, record: null, isLoading: false })
        }
        isLoading={dialog.isLoading}
      />

      <DashboardViewModal
        isOpen={viewModal.isOpen}
        onClose={handleCloseViewModal}
        recordId={viewModal.recordId}
        onEdit={(record) => {
          handleCloseViewModal();
          handleEdit(record);
        }}
      />

      <DashboardEditModal
        key={editModal.record?.ID || editModal.record?.id || "edit-modal"}
        isOpen={editModal.isOpen}
        onClose={handleCloseEditModal}
        record={editModal.record}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default DashboardTable;
