// ============================================
// FILE: src/components/upload/UploadIcon.jsx
// ============================================
import React from "react";
import { UploadCloud } from "lucide-react";

/**
 * Upload Icon Component
 * Displays the upload icon in a styled container
 */
const UploadIcon = () => {
  return (
    <div className="w-32 h-32 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl flex items-center justify-center mb-8 border border-cyan-200 transition-transform hover:scale-105">
      <UploadCloud className="w-16 h-16 text-[#0e7490]" strokeWidth={2} />
    </div>
  );
};

export default UploadIcon;
