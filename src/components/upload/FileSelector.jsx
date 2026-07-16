// ============================================
// FILE: src/components/upload/FileSelector.jsx
// ============================================
import React from "react";

/**
 * File Selector Component
 * Hidden file input with ref for triggering
 */
const FileSelector = ({
  fileInputRef,
  onFileSelect,
  accept = ".pdf,application/pdf",
}) => {
  return (
    <input
      ref={fileInputRef}
      type="file"
      accept={accept}
      onChange={onFileSelect}
      className="hidden"
      aria-label="Select file to upload"
    />
  );
};

export default FileSelector;
