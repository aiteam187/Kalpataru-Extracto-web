// ==========================================
// FILE: src/pages/BlockedVendorsList.jsx
// ==========================================
import React, { useState } from "react";
import { Shield, Search, RefreshCw } from "lucide-react";
import BlockedVendorsTable from "../components/blockedVendors/BlockedVendorsTable";
import UnblockConfirmDialog from "../components/blockedVendors/UnblockConfirmDialog";
import Loading from "../components/common/Loading";
import useBlockedVendors from "../hooks/useBlockedVendors";

/**
 * Blocked Vendors List Page
 * Displays all blocked vendors with search and unblock functionality
 */
const BlockedVendorsList = () => {
  const {
    data,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    handleUnblock,
    refresh,
  } = useBlockedVendors();

  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  /**
   * Open unblock confirmation dialog
   */
  const initiateUnblock = (vendor) => {
    setSelectedVendor(vendor);
    setUnblockModalOpen(true);
  };

  /**
   * Confirm and execute unblock
   */
  const confirmUnblock = async () => {
    if (selectedVendor) {
      await handleUnblock(selectedVendor.id);
      setUnblockModalOpen(false);
      setSelectedVendor(null);
    }
  };

  if (loading) {
    return (
      <main className="p-8">
        <Loading size="lg" fullScreen={false} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 fade-in max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-semibold text-gray-800">
            Blacklist Vendor
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          Manage and monitor blocked vendors
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Vender Name, ID, GSTIN nu......"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Blocked Vendors</p>
            <p className="text-3xl font-bold text-red-600">{data.length}</p>
          </div>
          <Shield className="w-12 h-12 text-red-400 opacity-50" />
        </div>
      </div>

      {/* Blocked Vendors Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <BlockedVendorsTable data={data} onUnblock={initiateUnblock} />
      </div>

      {/* Empty State */}
      {data.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No blocked vendors found
          </h3>
          <p className="text-sm text-gray-600">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "All vendors are currently active"}
          </p>
        </div>
      )}

      {/* Unblock Confirmation Dialog */}
      {unblockModalOpen && selectedVendor && (
        <UnblockConfirmDialog
          vendor={selectedVendor}
          onConfirm={confirmUnblock}
          onCancel={() => {
            setUnblockModalOpen(false);
            setSelectedVendor(null);
          }}
        />
      )}
    </main>
  );
};

export default BlockedVendorsList;
