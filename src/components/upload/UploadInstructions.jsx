// ============================================
// FILE: src/components/upload/UploadInstructions.jsx (PROFESSIONAL REDESIGN)
// ============================================
import React from "react";
import { FileCheck, Maximize2, Eye, Clock } from "lucide-react";

/**
 * Professional Upload Instructions Component
 * Icon-based step indicators with clear requirements
 */
const UploadInstructions = () => {
  const instructions = [
    {
      icon: FileCheck,
      title: "File Format",
      description: "Only PDF files are accepted",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Maximize2,
      title: "File Size",
      description: "Maximum file size: 10MB",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Eye,
      title: "Readability",
      description: "Ensure the invoice is clear and readable",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Clock,
      title: "Processing Time",
      description: "Typically takes 10-30 seconds",
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {instructions.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div
              className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UploadInstructions;
