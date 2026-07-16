// ==========================================
// FILE: src/pages/MasterData.jsx (UPDATED)
// ==========================================
import React, { useState } from "react";
import { MasterDataFilters } from "../components/masterData/MasterDataFilters";
import MasterDataTable from "../components/masterData/MasterDataTable";
import BlockVendorModal from "../components/masterData/BlockVendorModal";
import Loading from "../components/common/Loading";
import useMasterData from "../hooks/useMasterData";
import masterDataService from "../services/masterDataService";
import BlockVendorDialog from "../components/dashboard/BlockVendorDialog";

/**
 * MasterData Page Component
 * Main page for vendor master data management
 * Now includes Block/Unblock vendor functionality with loading states
 */
const MasterData = () => {
  const {
    data,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    handleEdit,
    handleDelete,
    handleView,
    refresh,
  } = useMasterData();

  // State for block vendor modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isBlockLoading, setIsBlockLoading] = useState(false);

  // State for unblock dialog
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [isUnblockLoading, setIsUnblockLoading] = useState(false);

  const monthOptions = [
    { value: "month", label: "Month" },
    { value: "january", label: "January" },
    { value: "february", label: "February" },
    { value: "march", label: "March" },
    { value: "april", label: "April" },
    { value: "may", label: "May" },
    { value: "june", label: "June" },
    { value: "july", label: "July" },
    { value: "august", label: "August" },
    { value: "september", label: "September" },
    { value: "october", label: "October" },
    { value: "november", label: "November" },
    { value: "december", label: "December" },
  ];

  /**
   * Handle Block Vendor
   */
  const handleBlock = (vendorId, vendorData) => {
    console.log("Block vendor:", vendorId);
    setSelectedVendor(vendorData);
    setBlockModalOpen(true);
  };

  /**
   * Handle Unblock Vendor - Show confirmation dialog
   */
  const handleUnblock = (vendorId, vendorData) => {
    console.log("Unblock vendor:", vendorId);
    setSelectedVendor(vendorData);
    setUnblockDialogOpen(true);
  };

  /**
   * Confirm Block Vendor (called from modal)
   */
  const confirmBlockVendor = async (blockData) => {
    if (isBlockLoading) return;

    setIsBlockLoading(true);

    try {
      // Call API to block vendor
      await masterDataService.blockVendor(selectedVendor.id, blockData);

      console.log("Blocking vendor with data:", blockData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success notification
      alert("✅ Vendor blocked successfully!");

      // Close modal and refresh
      setBlockModalOpen(false);
      setSelectedVendor(null);
      refresh();
    } catch (error) {
      console.error("Error blocking vendor:", error);
      alert("❌ Failed to block vendor. Please try again.");
    } finally {
      setIsBlockLoading(false);
    }
  };

  /**
   * Confirm Unblock Vendor (called from dialog)
   */
  const confirmUnblockVendor = async () => {
    if (isUnblockLoading) return;

    setIsUnblockLoading(true);

    try {
      // Call API to unblock vendor
      await masterDataService.unblockVendor(selectedVendor.id);

      console.log(`Vendor ${selectedVendor.id} unblocked successfully`);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setUnblockDialogOpen(false);

      // Success notification
      alert("✅ Vendor unblocked successfully!");

      // Refresh data
      setSelectedVendor(null);
      refresh();
    } catch (error) {
      console.error("Error unblocking vendor:", error);
      alert("❌ Failed to unblock vendor. Please try again.");
    } finally {
      setIsUnblockLoading(false);
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
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="p-8 fade-in max-w-full overflow-x-hidden">
        {/* Page Header with Title and Filters */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">Master Data</h1>

          <MasterDataFilters
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            monthValue={selectedMonth}
            onMonthChange={setSelectedMonth}
            monthOptions={monthOptions}
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <MasterDataTable
            data={data}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
          />
        </div>

        {/* Block Vendor Modal */}
        {blockModalOpen && selectedVendor && (
          <BlockVendorModal
            vendor={selectedVendor}
            onConfirm={confirmBlockVendor}
            onCancel={() => {
              if (!isBlockLoading) {
                setBlockModalOpen(false);
                setSelectedVendor(null);
              }
            }}
            isLoading={isBlockLoading}
          />
        )}
      </main>

      {/* Unblock Vendor Dialog */}
      <BlockVendorDialog
        isOpen={unblockDialogOpen}
        onClose={() => {
          if (!isUnblockLoading) {
            setUnblockDialogOpen(false);
            setSelectedVendor(null);
          }
        }}
        onConfirm={confirmUnblockVendor}
        vendorName={selectedVendor?.vendorName}
        action="unblock"
        isLoading={isUnblockLoading}
      />
    </>
  );
};

export default MasterData;
