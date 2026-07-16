import { useState, useEffect, useCallback, useRef } from "react";
import invoiceService from "../services/invoiceService";

/**
 * Custom hook for fetching invoice data
 * @param {Object} options - { autoFetch, params }
 * @returns {Object}
 */
const useInvoiceData = (options = {}) => {
  const { autoFetch = true, params = {} } = options;

  const [stats, setStats] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Use ref to store latest params without causing re-renders
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  /**
   * Fetch all data (stats + records)
   */
  const fetchAllData = useCallback(async (fetchParams) => {
    try {
      setLoading(true);
      setError(null);
      const actualParams = fetchParams || paramsRef.current;
      console.log("🔄 fetchAllData called with params:", actualParams);

      const [statsData, recordsData] = await Promise.all([
        invoiceService.getDashboardStats(actualParams),
        invoiceService.getRecords(actualParams),
      ]);

      setStats(statsData);
      console.log("✅ Stats set:", statsData?.length);

      if (recordsData.data) {
        setRecords(recordsData.data);
        setPagination({
          page: recordsData.page || 1,
          totalPages: recordsData.totalPages || 1,
          total: recordsData.total || 0,
        });
        console.log("✅ Records set:", recordsData.data?.length);
      } else {
        setRecords(recordsData);
        console.log("✅ Records set (direct):", recordsData?.length);
      }

      console.log("✅ fetchAllData completed");
    } catch (err) {
      setError(err.message || "Failed to fetch data");
      console.error("❌ Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch dashboard statistics
   */
  const fetchStats = useCallback(async (fetchParams) => {
    try {
      setLoading(true);
      setError(null);
      const actualParams = fetchParams || paramsRef.current;
      console.log("📊 Fetching stats with params:", actualParams);
      const data = await invoiceService.getDashboardStats(actualParams);
      setStats(data);
      console.log("✅ Stats fetched:", data?.length);
    } catch (err) {
      setError(err.message || "Failed to fetch statistics");
      console.error("❌ Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch invoice records
   */
  const fetchRecords = useCallback(async (fetchParams) => {
    try {
      setLoading(true);
      setError(null);
      const actualParams = fetchParams || paramsRef.current;
      console.log("📋 Fetching records with params:", actualParams);
      const response = await invoiceService.getRecords(actualParams);

      if (response.data) {
        setRecords(response.data);
        setPagination({
          page: response.page || 1,
          totalPages: response.totalPages || 1,
          total: response.total || 0,
        });
        console.log("✅ Records fetched:", response.data?.length);
      } else {
        setRecords(response);
        console.log("✅ Records fetched (direct):", response?.length);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch records");
      console.error("❌ Error fetching records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh data - stable callback that won't change
   */
  const refresh = useCallback(
    async (newParams) => {
      console.log("🔄 REFRESH called with:", newParams);
      console.log("🔄 Current params ref:", paramsRef.current);
      await fetchAllData(newParams);
      console.log("✅ REFRESH completed");
    },
    [fetchAllData],
  );

  // Silent background poll — no loading spinner
  const silentPoll = useCallback(async () => {
    try {
      const [statsData, recordsData] = await Promise.all([
        invoiceService.getDashboardStats(paramsRef.current),
        invoiceService.getRecords(paramsRef.current),
      ]);
      setStats(statsData);
      if (recordsData.data) {
        setRecords(recordsData.data);
        setPagination({ page: recordsData.page || 1, totalPages: recordsData.totalPages || 1, total: recordsData.total || 0 });
      } else {
        setRecords(recordsData);
      }
    } catch {
      // silent — don't surface polling errors
    }
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAllData();
    }
  }, [autoFetch, fetchAllData]);



  return {
    // Data
    stats,
    records,
    pagination,

    // State
    loading,
    error,

    // Actions
    fetchStats,
    fetchRecords,
    fetchAllData,
    refresh,
    setRecords,
    setStats,
  };
};

export default useInvoiceData;
