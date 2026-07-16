// ============================================
// FILE: src/components/upload/ProcessButton.jsx
// ============================================
import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Process Button Component
 * Button to start processing the uploaded file
 */
const ProcessButton = ({ onClick, disabled = false, loading = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-80 bg-green-600 hover:bg-green-700 text-white px-12 py-5 rounded-lg font-bold text-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {loading ? "Processing..." : "Process Invoice"}
    </button>
  );
};

export default ProcessButton;
