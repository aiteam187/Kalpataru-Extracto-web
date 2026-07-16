// ============================================
// FILE: src/utils/invoiceDataMapper.js (FIXED - ACCURACY AT ROOT)
// ============================================

/**
 * Map backend response to frontend invoice structure
 * NOW FULLY DYNAMIC - extracts ALL fields from backend
 */
export const mapBackendToInvoice = (backendData, fileName) => {
  console.log("🔄 Mapping backend data to invoice format");

  const fileData = backendData.files?.[0] || backendData;

  if (!fileData) {
    console.warn("⚠️ No file data found in response");
    return createEmptyInvoice(fileName);
  }

  const { data = {}, confidence = {}, meta = {}, file_base64, flow } = fileData;

  // Check if any data was extracted
  const hasData = Object.keys(data).length > 0;

  // ✅ Extract backend accuracy FIRST (before anything else)
  const backendAccuracy = fileData.accuracy ?? meta.accuracy ?? 0;

  console.log(
    "🎯 Backend accuracy extracted from files[0]:",
    fileData.accuracy,
  );
  console.log("🎯 Backend accuracy extracted from meta:", meta.accuracy);
  console.log("🎯 FINAL backend accuracy:", backendAccuracy);

  // Transform ALL fields from backend into validations
  const validations = transformToValidations(data, confidence);

  const invoiceData = {
    id: fileName,
    fileName: fileData.filename || fileName,
    imageFileName: fileData.filename || fileName,
    status: determineStatus(flow),
    flow: flow || "inward",
    base64Data: file_base64,
    hasData,
    validations,
    rawData: data, // ✅ Store original data for mapping
    comments: "",
    accuracy: backendAccuracy, // ✅ CRITICAL: Store accuracy at ROOT level
    metadata: {
      accuracy: backendAccuracy, // ✅ Also keep in metadata for backward compatibility
      confidenceLevel: meta.confidence_level || "UNKNOWN",
      decision: meta.decision || "PENDING",
    },
  };

  console.log("✅ Mapped invoice data:", {
    fileName: invoiceData.fileName,
    fieldsCount: validations.length,
    flow: invoiceData.flow,
    accuracy: invoiceData.accuracy, // ✅ Log the accuracy
  });

  return invoiceData;
};

/**
 * Transform ALL backend fields into validations array
 * ✅ FULLY DYNAMIC - no hardcoded field list
 */
const transformToValidations = (data, confidence) => {
  const validations = [];
  let id = 1;

  // Skip system fields that shouldn't be shown in UI
  const skipFields = [
    "accuracy",
    "approval_status",
    "human_investigation",
    "flow",
  ];

  // Process ALL fields dynamically
  Object.keys(data).forEach((fieldKey) => {
    if (skipFields.includes(fieldKey)) return;

    const value = data[fieldKey];
    const conf = confidence[fieldKey] || "UNKNOWN";

    validations.push({
      id: id++,
      label: formatFieldName(fieldKey), // Convert field name to readable label
      fieldName: fieldKey, // ✅ Store original field name for mapping
      value: value,
      invoiceValue: value,
      confidence: conf,
      isConfirmed: conf === "HIGH",
    });
  });

  const highCount = validations.filter((v) => v.confidence === "HIGH").length;
  console.log(
    `📊 Extracted ${validations.length} fields (${highCount} HIGH confidence)`,
  );

  return validations;
};

/**
 * Format field name from any case to Title Case
 */
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/_/g, " ") // Replace underscores
    .replace(/([A-Z])/g, " $1") // Add space before capitals
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Determine status from flow
 */
const determineStatus = (flow) => {
  if (!flow) return "Pending";

  switch (flow.toLowerCase()) {
    case "inward":
      return "Inward";
    case "outward":
      return "Outward";
    default:
      return flow.charAt(0).toUpperCase() + flow.slice(1);
  }
};

/**
 * Create empty invoice structure
 */
const createEmptyInvoice = (fileName) => {
  return {
    id: fileName,
    fileName: fileName,
    imageFileName: fileName,
    status: "Pending",
    flow: "unknown",
    base64Data: null,
    hasData: false,
    validations: [],
    rawData: {},
    comments: "",
    accuracy: 0, // ✅ Add accuracy at root
    metadata: {
      accuracy: 0,
      confidenceLevel: "UNKNOWN",
      decision: "PENDING",
    },
  };
};

export default mapBackendToInvoice;
