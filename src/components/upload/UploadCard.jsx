// ============================================
// FILE: src/components/upload/UploadCard.jsx (PROFESSIONAL REDESIGN - FIXED)
// ============================================
import React, { useState } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import FileSelector from "./FileSelector";
import FilePreview from "./FilePreview";
import UploadProgress from "./UploadProgress";

/**
 * Professional Upload Card Component
 * Clean, minimal design focused on clarity
 * Fixed: Consistent height across all states
 */
const UploadCard = ({
  fileInputRef,
  selectedFile,
  uploading,
  uploadProgress,
  onFileSelect,
  onUploadClick,
  onProcess,
  onRemoveFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const event = {
        target: {
          files: files,
        },
      };
      onFileSelect(event);
    }
  };

  // UPLOADING STATE
  if (uploading) {
    return (
      <div className="p-12 min-h-[500px] flex flex-col items-center justify-center">
        {/* Processing Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-50 rounded-full mb-4">
            <div className="relative w-12 h-12">
              <div className="absolute w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Invoice
          </h3>
          <p className="text-sm text-gray-600">
            Please wait while we extract and validate your invoice data
          </p>
        </div>

        {/* Progress Section */}
        <div className="max-w-xl mx-auto w-full">
          <UploadProgress progress={uploadProgress} />

          {/* File Info Card */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // NO FILE SELECTED STATE
  if (!selectedFile) {
    return (
      <div
        className={`p-12 min-h-[500px] flex items-center justify-center border-2 border-dashed rounded-xl transition-colors ${
          isDragging
            ? "border-teal-500 bg-teal-50/50"
            : "border-gray-300 bg-white"
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileSelector fileInputRef={fileInputRef} onFileSelect={onFileSelect} />

        <div className="text-center">
          {/* Upload Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-xl mb-6">
            <Upload className="w-12 h-12 text-teal-600" strokeWidth={2} />
          </div>

          {/* Main Heading */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Invoice Document
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Drag and drop your PDF file here, or click the button below to
            browse
          </p>

          {/* Upload Button */}
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Choose File
          </button>

          {/* Supported Format Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Supported format:{" "}
              <span className="font-medium text-gray-700">PDF</span> • Maximum
              size: <span className="font-medium text-gray-700">10 MB</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // FILE SELECTED STATE
  return (
    <div className="p-12 min-h-[500px] flex items-center justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            File Ready for Processing
          </h3>
          <p className="text-sm text-gray-600">
            Review the details below and click process to continue
          </p>
        </div>

        {/* File Preview */}
        <FilePreview file={selectedFile} onRemove={onRemoveFile} />

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mt-8">
          <button
            onClick={onRemoveFile}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Remove File
          </button>
          <button
            onClick={onProcess}
            disabled={uploading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadCard;
