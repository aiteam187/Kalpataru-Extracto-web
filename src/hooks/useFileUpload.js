// ============================================
// FILE: src/hooks/useFileUpload.js (FIXED)
// ============================================
import { useState, useRef, useCallback } from "react";
import { validateFile } from "../utils/fileValidation";
import { useAppContext } from "../context/AppContext";
import uploadService from "../services/uploadService";
import { mapBackendToInvoice } from "../utils/invoiceDataMapper";

const useFileUpload = () => {
  const { showNotification } = useAppContext();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const uploadingRef = useRef(false);

  // In-memory cache to store extracted data (keyed by filename)
  const dataCache = useRef({});

  /**
   * Handle file selection from input
   */
  const handleFileSelect = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file
      const validation = validateFile(file);
      if (!validation.success) {
        showNotification(validation.error, "error");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      console.log("📁 File selected:", file.name, file.size, "bytes");
      setSelectedFile(file);
      setUploadProgress(0);
    },
    [showNotification],
  );

  /**
   * Trigger file input click
   */
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Upload file to backend and cache the response
   */
  const uploadFile = useCallback(async () => {
    if (!selectedFile || uploadingRef.current) {
      console.warn("⚠️ Upload blocked: No file or already uploading");
      return null;
    }

    try {
      uploadingRef.current = true;
      setUploading(true);
      setUploadProgress(0);

      console.log("📤 Starting upload:", selectedFile.name);

      // Upload to backend with progress tracking
      const result = await uploadService.uploadAndExtract(
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        },
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Map backend response to frontend format
      const invoiceData = mapBackendToInvoice(result.data, selectedFile.name);

      // Check if any data was extracted
      if (!invoiceData.hasData) {
        showNotification(
          "No data could be extracted from the document",
          "warning",
        );
      } else {
        showNotification(
          `Invoice processed successfully! (${invoiceData.flow.toUpperCase()})`,
          "success",
        );
      }

      // Cache the data using filename as key
      dataCache.current[selectedFile.name] = invoiceData;

      console.log("💾 Cached invoice data:", selectedFile.name);
      console.log("📊 Extracted fields:", invoiceData.validations.length);

      return {
        invoiceId: selectedFile.name,
        cachedData: invoiceData,
        status: "success",
      };
    } catch (error) {
      console.error("❌ Upload error:", error);
      showNotification(error.message, "error");
      setUploadProgress(0);
      throw error;
    } finally {
      setTimeout(() => {
        setUploading(false);
        uploadingRef.current = false;
      }, 500);
    }
  }, [selectedFile, showNotification]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    console.log("🗑️ Clearing all cached data");
    dataCache.current = {};
  }, []);

  /**
   * Reset upload state completely
   * ✅ NOW ALSO CLEARS THE CACHE
   */
  const resetUpload = useCallback(() => {
    console.log("🔄 Resetting upload state and clearing cache");
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    uploadingRef.current = false;

    // ✅ CLEAR THE CACHE - This was missing!
    dataCache.current = {};

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  /**
   * Remove selected file
   */
  const removeFile = useCallback(() => {
    console.log("🗑️ Removing file");
    resetUpload();
  }, [resetUpload]);

  /**
   * Get cached invoice data by filename
   */
  const getCachedData = useCallback((filename) => {
    const cached = dataCache.current[filename];
    console.log("📦 Getting cached data for:", filename, cached ? "✅" : "❌");
    return cached || null;
  }, []);

  /**
   * Check backend health
   */
  const checkBackend = useCallback(async () => {
    const isHealthy = await uploadService.checkBackendHealth();
    if (isHealthy) {
      showNotification("Backend is running ✓", "success");
    } else {
      showNotification(
        `Cannot connect to backend at ${uploadService.getBackendUrl()}`,
        "error",
      );
    }
    return isHealthy;
  }, [showNotification]);

  return {
    selectedFile,
    uploading,
    uploadProgress,
    fileInputRef,
    handleFileSelect,
    triggerFileSelect,
    uploadFile,
    resetUpload,
    removeFile,
    getCachedData,
    clearCache,
    checkBackend,
  };
};

export default useFileUpload;
