import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import useFileUpload from "../hooks/useFileUpload";
import UploadCard from "../components/upload/UploadCard";
import UploadInstructions from "../components/upload/UploadInstructions";
import UploadInvoiceDetail from "../components/upload/UploadInvoiceDetail";
import { Upload as UploadIcon } from "lucide-react";

const Upload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    showInvoiceDetail,
    currentInvoiceId,
    setShowInvoiceDetail,
    setCurrentInvoiceId,
  } = useAppContext();

  const {
    selectedFile,
    uploading,
    uploadProgress,
    fileInputRef,
    handleFileSelect,
    triggerFileSelect,
    uploadFile,
    removeFile,
    resetUpload,
    getCachedData,
  } = useFileUpload();

  const processingRef = useRef(false);

  console.log("📄 Upload page render:", {
    id,
    showInvoiceDetail,
    currentInvoiceId,
  });

  // Reset upload state when coming back to /upload (no ID)
  useEffect(() => {
    if (!id) {
      console.log("🔄 No invoice ID, resetting state");
      resetUpload();
      setShowInvoiceDetail(false);
      setCurrentInvoiceId(null);
    }
  }, [id, resetUpload, setShowInvoiceDetail, setCurrentInvoiceId]);

  const handleProcess = async () => {
    if (uploading || processingRef.current || !selectedFile) return;

    try {
      processingRef.current = true;
      console.log("📤 Processing file upload...");
      const result = await uploadFile();

      if (result && result.invoiceId) {
        console.log("✅ Upload successful, navigating to:", result.invoiceId);
        setCurrentInvoiceId(result.invoiceId);
        setShowInvoiceDetail(true);
        navigate(`/upload/${result.invoiceId}`);
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
    } finally {
      processingRef.current = false;
    }
  };

  // Show invoice detail if we have an ID in the URL
  if (id) {
    console.log("📋 Showing invoice detail for:", id);
    const cachedData = getCachedData(id);

    return (
      <div className="animate-in fade-in duration-500 space-y-5">
        <UploadInvoiceDetail
          invoiceId={id}
          fileName={selectedFile?.name || id}
          cachedData={cachedData}
        />
      </div>
    );
  }

  // Show upload form (fresh state)
  console.log("📁 Showing upload form");
  return (
    <div className="animate-in fade-in duration-500 space-y-5">
      {/* Page Header - matches Dashboard style */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
            <UploadIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-none">
              Upload Invoice
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload and process your invoice documents
            </p>
          </div>
        </div>
      </div>

      {/* Main Upload Area - Larger Size */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <UploadCard
          fileInputRef={fileInputRef}
          selectedFile={selectedFile}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onFileSelect={handleFileSelect}
          onUploadClick={triggerFileSelect}
          onProcess={handleProcess}
          onRemoveFile={removeFile}
        />
      </div>

      {/* Instructions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            Upload Instructions
          </h3>
        </div>
        <div className="p-6">
          <UploadInstructions />
        </div>
      </div>
    </div>
  );
};

export default Upload;
