// ============================================
// FILE: src/components/upload/UploadButton.jsx
// ============================================
import React from "react";

/**
 * Upload Button Component
 * Primary button for triggering file selection
 */
const UploadButton = ({ onClick, disabled = false, children = "Upload" }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-80 bg-[#0e7490] hover:bg-[#0c5f7a] text-white px-12 py-5 rounded-lg font-bold text-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
    >
      {children}
    </button>
  );
};

export default UploadButton;
