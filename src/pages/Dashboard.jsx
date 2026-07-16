import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import DashboardStats from "../components/dashboard/DashboardStats";
import DashboardTable from "../components/dashboard/DashboardTable";
import DashboardEditModal from "../components/dashboard/DashboardEditModal";
import Loading from "../components/common/Loading";
import useInvoiceData from "../hooks/useInvoiceData";
import invoiceService from "../services/invoiceService";
import { useAppContext } from "../context/AppContext";
import { Search, RefreshCw, Building2 } from "lucide-react";

const Dashboard = () => {
  const { showNotification } = useAppContext();
  const location = useLocation();
  const [vendorSearch, setVendorSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);

  const { stats, records, loading, error, refresh } = useInvoiceData({
    autoFetch: true,
    params: {},
  });

  // Re-fetch whenever user navigates to /dashboard (e.g. after uploading)
  useEffect(() => {
    refresh({});
  }, [location.pathname]);

  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  console.log("📊 Dashboard render - records count:", records?.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const roundedTime = new Date(now);
    roundedTime.setMinutes(0);
    roundedTime.setSeconds(0);
    roundedTime.setMilliseconds(0);
    setLastSyncTime(roundedTime);
  }, []);

  const getSyncStatusDisplay = () => {
    if (!lastSyncTime) return "Not synced yet";
    const hours = lastSyncTime.getHours();
    const minutes = lastSyncTime.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const timeString =
      minutes === 0
        ? `${displayHours}:00 ${ampm}`
        : `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    return `Last Sync - ${timeString}`;
  };

  const getTimeSinceSync = () => {
    if (!lastSyncTime) return "";
    const diffMs = currentTime - lastSyncTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const coloredStats =
    stats?.map((stat) => {
      const label = stat.label?.toUpperCase() || "";
      let color = "slate";
      let filterKey = null;

      if (label.includes("TOTAL")) {
        color = "slate";
        filterKey = "total";
      } else if (label.includes("INWARD")) {
        color = "blue";
        filterKey = "inward";
      } else if (label.includes("OUTWARD")) {
        color = "cyan";
        filterKey = "outward";
      } else if (label.includes("RETURNABLE")) {
        color = "amber";
        filterKey = "returnable";
      } else if (label.includes("TODAY")) {
        color = "emerald";
        filterKey = "today";
      } else if (label.includes("LAST HOUR")) {
        color = "rose";
        filterKey = "lasthour";
      }

      return {
        ...stat,
        color,
        filterKey,
        isActive: activeFilter === filterKey,
        onClick: () => {
          if (filterKey === "total") setActiveFilter(null);
          else setActiveFilter(activeFilter === filterKey ? null : filterKey);
        },
      };
    }) || [];

  useEffect(() => {
    if (activeFilter) {
      setTimeout(() => {
        document.querySelector(".data-status-section")?.scrollIntoView({
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
        document.getElementById("global-search")?.focus();
      }
      if (e.altKey) {
        switch (e.key) {
          case "1":
            setActiveFilter(activeFilter === "approve" ? null : "approve");
            break;
          case "2":
            setActiveFilter(activeFilter === "reject" ? null : "reject");
            break;
          case "3":
            setActiveFilter(activeFilter === "pending" ? null : "pending");
            break;
          case "4":
            setActiveFilter(activeFilter === "inward" ? null : "inward");
            break;
          case "5":
            setActiveFilter(activeFilter === "outward" ? null : "outward");
            break;
          case "0":
            setActiveFilter(null);
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFilter]);

  const handleSyncRun = async () => {
    try {
      setSyncing(true);
      const syncStartTime = new Date();
      await invoiceService.syncData({});
      const roundedTime = new Date(syncStartTime);
      roundedTime.setMinutes(0);
      roundedTime.setSeconds(0);
      roundedTime.setMilliseconds(0);
      setLastSyncTime(roundedTime);
      await refresh({});
      showNotification("Sync completed successfully", "success");
    } catch (err) {
      console.error("❌ Sync error:", err);
      showNotification("Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
  };

  const handleSaveEdit = useCallback(
    async function handleSaveEdit(updatedRecord) {
      try {
        await refresh({});
        setTimeout(
          () => showNotification("Record updated successfully", "success"),
          100,
        );
      } catch (err) {
        console.error("❌ Error in handleSaveEdit:", err);
        setTimeout(
          () => showNotification("Failed to refresh data", "error"),
          100,
        );
      }
    },
    [refresh],
  );

  if (loading)
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );

  if (error)
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
          onClick={() => refresh({})}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );

  // ── Search filter — covers project site, vehicle, doc number ──────────────
  const searchFilteredRecords = vendorSearch
    ? records.filter((r) => {
        const q = vendorSearch.toLowerCase();
        return (
          r.project_site?.toLowerCase().includes(q) || // ← project site
          r.destination_site?.toLowerCase().includes(q) || // ← destination
          r.vehicle_number?.toLowerCase().includes(q) ||
          r.invoice_number?.toLowerCase().includes(q) ||
          r.document_type?.toLowerCase().includes(q)
        );
      })
    : records;

  // ── Stats filter ──────────────────────────────────────────────────────────
  const filteredRecords = activeFilter
    ? searchFilteredRecords.filter((r) => {
        if (activeFilter === "inward")
          return r.inward_outward?.toLowerCase() === "inward";
        if (activeFilter === "outward")
          return r.inward_outward?.toLowerCase() === "outward";
        if (activeFilter === "returnable")
          return r.inward_outward?.toLowerCase() === "returnable";
        if (activeFilter === "today") {
          if (!r.action_date) return false;
          const d = new Date(r.action_date);
          const now = new Date();
          return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        }
        if (activeFilter === "lasthour") {
          if (!r.action_date) return false;
          return new Date() - new Date(r.action_date) <= 60 * 60 * 1000;
        }
        return true;
      })
    : searchFilteredRecords;

  return (
    <>
      <div className="animate-in fade-in duration-500 space-y-5">
        {/* 1. Dashboard Controls */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-none">
                  Dashboard
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Manage and sync data
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search — updated placeholder */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="global-search"
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search site, vehicle, doc no..."
                  className="pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full md:w-[260px] transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:block">
                  <kbd className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">
                    ⌘K
                  </kbd>
                </div>
              </div>

              <div className="h-8 w-px bg-gray-200 mx-1 hidden lg:block" />

              {/* Sync */}
              <div className="flex items-center gap-4 pl-2">
                <div className="hidden sm:block text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Live Sync
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-[11px] font-semibold text-gray-600">
                      {getSyncStatusDisplay()}
                    </p>
                    {lastSyncTime && (
                      <span className="text-[10px] text-gray-400">
                        ({getTimeSinceSync()})
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSyncRun}
                  disabled={syncing}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                  />
                  <span>Sync Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Stats Cards */}
        <DashboardStats stats={coloredStats} loading={loading} />

        {/* 3. Data Table */}
        <div
          className="data-status-section bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col"
          style={{ overflow: "visible" }}
        >
          <DashboardTable
            records={filteredRecords}
            showNotification={showNotification}
            onEditRecord={handleEditRecord}
            onBlockVendor={() => refresh({})}
            onUnblockVendor={() => refresh({})}
            onDeleteRecord={() => refresh({})}
            activeFilter={activeFilter}
            onClearFilter={() => setActiveFilter(null)}
          />
        </div>

        {activeFilter && (
          <div className="text-center py-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-slate-700">
              Showing{" "}
              <span className="font-bold text-blue-600">
                {filteredRecords.length}
              </span>{" "}
              of <span className="font-bold">{records.length}</span> total
              records
            </p>
          </div>
        )}

        <DashboardEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onSave={handleSaveEdit}
        />
      </div>
    </>
  );
};

export default Dashboard;
