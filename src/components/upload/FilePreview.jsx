// ============================================
// FILE: src/components/upload/FilePreview.jsx (PROFESSIONAL REDESIGN)
// ============================================
import React from "react";
import { X, FileText, CheckCircle } from "lucide-react";
import { formatFileSize } from "../../utils/fileValidation";

/**
 * Professional File Preview Component
 * Clean card design with file details
 */
const FilePreview = ({ file, onRemove }) => {
  if (!file) return null;

  return (
    <div className="bg-white rounded-lg border-2 border-teal-200 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {/* File Icon */}
        <div className="w-14 h-14 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-7 h-7 text-red-600" strokeWidth={2} />
        </div>

        {/* File Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Selected Document
            </p>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p
            className="text-base font-semibold text-gray-900 truncate mb-1"
            title={file.name}
          >
            {file.name}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="font-medium">{formatFileSize(file.size)}</span>
            <span className="text-gray-400">•</span>
            <span>PDF Document</span>
          </div>
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove file"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilePreview;
