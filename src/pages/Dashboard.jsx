import React, { useState, useEffect, useCallback } from "react";
import DashboardStats from "../components/dashboard/DashboardStats";
import DashboardTable from "../components/dashboard/DashboardTable";
import DashboardEditModal from "../components/dashboard/DashboardEditModal";
import useInvoiceData from "../hooks/useInvoiceData";
import invoiceService from "../services/invoiceService";
import { useAppContext } from "../context/AppContext";
import { RefreshCw } from "lucide-react";

const Dashboard = () => {
  const { showNotification, globalSearch } = useAppContext();
  const [activeFilter, setActiveFilter] = useState(null);

  const { stats, records, loading, error, refresh, silentPoll } = useInvoiceData({
    autoFetch: true,
    params: {},
  });

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

  // Auto-refresh dashboard data so records saved elsewhere (e.g. from the
  // Tab app) show up here without the user needing to click Sync Now or
  // reload the page. A once-an-hour poll left an already-open dashboard
  // tab showing stale data for up to an hour after a real save — this
  // polls every 20s, and also refetches immediately whenever the tab
  // regains focus/visibility (the common "switched away and back" case).
  // Uses silentPoll (not refresh) so it doesn't flash the full-page loading
  // spinner on every background check — only the initial load and an
  // explicit Sync Now click do that.
  useEffect(() => {
    const pollTimer = setInterval(() => {
      silentPoll();
    }, 20 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") silentPoll();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [silentPoll]);

  useEffect(() => {
    setLastSyncTime(new Date());
  }, []);

  const getSyncStatusDisplay = () => {
    if (!lastSyncTime) return "Not synced yet";
    const hours = lastSyncTime.getHours();
    const minutes = lastSyncTime.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
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
      } else if (label.includes("MANUAL")) {
        color = "rose";
        filterKey = "manual";
      } else if (label.includes("TODAY")) {
        color = "emerald";
        filterKey = "today";
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
      await invoiceService.syncData({});
      setLastSyncTime(new Date());
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
  const searchFilteredRecords = globalSearch
    ? records.filter((r) => {
        const q = globalSearch.toLowerCase();
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
        if (activeFilter === "manual")
          return r.entry_type?.toLowerCase() === "manual";
        return true;
      })
    : searchFilteredRecords;

  return (
    <>
      {/* Stats cards + table sit inside DashboardStats' p-6 / DashboardTable's
          px-6 padding on top of Layout's content-wrapper 20px padding (44px
          total from the content-wrapper's own left edge), while the Navbar's
          content sits 24px inside ITS wrapper (measured via computed style —
          the "px-3" class there is overridden to 24px by a global stylesheet,
          not the Tailwind 12px it looks like at a glance). Net mismatch is
          20px; pull this block left by that amount (keeping the right edge
          put via the width bump) so the cards/table left edge lines up with
          the Navbar's, without touching Navbar.jsx or Layout.jsx. */}
      <div
        className="animate-in fade-in duration-500 space-y-5"
        style={{ marginLeft: "-20px", width: "calc(100% + 20px)" }}
      >
        {/* 1. Dashboard Controls — entire box commented out (title block, and
            the Live Sync / Last Sync / Sync Now controls). The search box
            that used to live in here was moved to the Navbar (this project
            only has one real page today; see Navbar.jsx / AppContext's
            globalSearch).
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-4">
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
        */}

        {/* 2. Stats Cards */}
        <DashboardStats stats={coloredStats} loading={loading} />

        {/* 3. Data Table */}
        <div
          className="data-status-section bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col"
          style={{ overflow: "visible" }}
        >
          <DashboardTable
            records={filteredRecords}
            loading={loading}
            showNotification={showNotification}
            onEditRecord={handleEditRecord}
            onBlockVendor={() => refresh({})}
            onUnblockVendor={() => refresh({})}
            onDeleteRecord={() => refresh({})}
            onRecordUpdated={() => refresh({})}
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
