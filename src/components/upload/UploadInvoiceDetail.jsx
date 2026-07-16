import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MessageSquare, GripVertical } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import authService from "../../services/authService";
import InvoiceHeader from "../invoice/InvoiceHeader";
import PDFViewer from "../invoice/PDFViewer";
import ValidationSection from "../invoice/ValidationSection";
import CommentsSection from "../invoice/CommentsSection";
import ActionButtons from "../invoice/ActionButtons";
import ApproveRejectDialog from "../upload/ApproveRejectDialog";
import masterDataService from "../../services/masterDataService";
import { mapInvoiceToMaster } from "../../utils/invoiceToMasterMapper";

const UploadInvoiceDetail = ({ invoiceId, fileName, cachedData }) => {
  const navigate = useNavigate();
  const { showNotification, setShowInvoiceDetail, setCurrentInvoiceId } =
    useAppContext();

  const loggedInUser = authService.getUser();

  const approverName =
    loggedInUser?.Emp_Name ||
    loggedInUser?.emp_name ||
    loggedInUser?.Employee_Name ||
    loggedInUser?.employee_name ||
    loggedInUser?.name ||
    loggedInUser?.Name ||
    loggedInUser?.full_name ||
    loggedInUser?.Full_Name ||
    loggedInUser?.username ||
    loggedInUser?.Username ||
    "Unknown User";

  // State
  const [invoiceData, setInvoiceData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [comments, setComments] = useState("");
  const [humanIntervention, setHumanIntervention] = useState(false);
  const [invChecked, setInvChecked] = useState(false);

  const [showActionDialog, setShowActionDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompactPDF, setIsCompactPDF] = useState(false);
  const containerRef = useRef(null);

  const stats = {
    totalFields:
      invoiceData?.validations?.filter(
        (v) => v.label?.toLowerCase() !== "comments",
      )?.length || 0,
    highConfidence:
      invoiceData?.validations?.filter(
        (v) => v.confidence === "HIGH" && v.label?.toLowerCase() !== "comments",
      )?.length || 0,
    lowConfidence:
      invoiceData?.validations?.filter(
        (v) =>
          v.confidence !== "HIGH" &&
          v.confidence !== "MODIFIED" &&
          v.label?.toLowerCase() !== "comments",
      )?.length || 0,
    modifiedFields:
      invoiceData?.validations?.filter(
        (v) =>
          v.confidence === "MODIFIED" && v.label?.toLowerCase() !== "comments",
      )?.length || 0,
    accuracy: invoiceData?.accuracy ?? invoiceData?.metadata?.accuracy ?? 0,
  };

  // Load data from cache - WITH DEBUG LOGGING
  useEffect(() => {
    if (cachedData) {
      const normalizedData = {
        ...cachedData,
        validations: cachedData.validations.map((v) => ({
          ...v,
          invoiceValue: v.invoiceValue !== undefined ? v.invoiceValue : v.value,
        })),
      };

      // 🔍 PDF DEBUG - Check what data is being passed to PDFViewer
      console.log("🔍 PDF DEBUG:", {
        fileName: normalizedData.fileName,
        imageFileName: normalizedData.imageFileName,
        hasBase64: !!normalizedData.base64Data,
        base64Length: normalizedData.base64Data?.length || 0,
        base64Preview: normalizedData.base64Data?.substring(0, 50) || "none",
        flow: normalizedData.flow,
        status: normalizedData.status,
      });

      setInvoiceData(normalizedData);
      setOriginalData(JSON.parse(JSON.stringify(normalizedData)));
      setComments(normalizedData.comments || "");
      checkHumanIntervention(normalizedData.validations);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [cachedData, invoiceId]);

  const checkHumanIntervention = (validations) => {
    if (!validations || !originalData) return;

    const hasEdits = validations.some((v) => {
      const original = originalData?.validations.find((ov) => ov.id === v.id);
      if (!original) return false;

      const currentValue =
        v.invoiceValue !== undefined ? v.invoiceValue : v.value;
      const originalValue = original.value;

      return currentValue !== originalValue;
    });

    const hasLowConfidence = validations.some(
      (v) => v.confidence !== "HIGH" && v.confidence !== "MODIFIED",
    );
    const needsIntervention = hasEdits || hasLowConfidence;
    setHumanIntervention(needsIntervention);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newPosition =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      const clampedPosition = Math.max(30, Math.min(70, newPosition));
      setSplitPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const handleEditOCR = () => {
    setIsEditMode(true);
    showNotification(
      "Edit mode activated. You can now modify the fields.",
      "info",
    );
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (cachedData) {
      const normalizedData = {
        ...cachedData,
        validations: cachedData.validations.map((v) => ({
          ...v,
          invoiceValue: v.invoiceValue !== undefined ? v.invoiceValue : v.value,
        })),
      };
      setInvoiceData(normalizedData);
      checkHumanIntervention(normalizedData.validations);
    }
    showNotification("Changes discarded", "info");
  };

  const handleValueChange = (itemId, field, value) => {
    setInvoiceData((prev) => {
      const updated = {
        ...prev,
        validations: prev.validations.map((item) => {
          if (item.id === itemId) {
            const original = originalData?.validations.find(
              (ov) => ov.id === itemId,
            );
            const originalValue = original?.value;
            const originalConfidence = original?.confidence;

            const normalizedCurrentValue =
              value === null || value === undefined || value === ""
                ? ""
                : value;
            const normalizedOriginalValue =
              originalValue === null ||
              originalValue === undefined ||
              originalValue === ""
                ? ""
                : originalValue;

            const isModified =
              normalizedCurrentValue !== normalizedOriginalValue;

            return {
              ...item,
              invoiceValue: value,
              confidence: isModified ? "MODIFIED" : originalConfidence,
            };
          }
          return item;
        }),
      };
      checkHumanIntervention(updated.validations);
      return updated;
    });
  };

  const handleSaveEdit = () => {
    setIsEditMode(false);

    const hasChanges = invoiceData.validations.some((v) => {
      const original = originalData?.validations?.find((ov) => ov.id === v.id);
      if (!original) return false;
      const currentValue =
        v.invoiceValue !== undefined ? v.invoiceValue : v.value;
      const originalValue = original.value;

      const normalizedCurrent =
        currentValue === null ||
        currentValue === undefined ||
        currentValue === ""
          ? ""
          : currentValue;
      const normalizedOriginal =
        originalValue === null ||
        originalValue === undefined ||
        originalValue === ""
          ? ""
          : originalValue;

      return normalizedCurrent !== normalizedOriginal;
    });

    if (hasChanges) {
      setInvChecked(true);
    } else {
      setInvChecked(false);
    }

    checkHumanIntervention(invoiceData.validations);
    showNotification(
      hasChanges ? "Changes saved. Ready to approve." : "No changes to save.",
      hasChanges ? "success" : "info",
    );
  };

  const handleCommentsChange = (newComments) => {
    setComments(newComments);
  };

  const handleBackToUpload = () => {
    setShowInvoiceDetail(false);
    setCurrentInvoiceId(null);
    navigate("/upload", { replace: true });
  };

  const handleCancelClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isEditMode) {
      showNotification("Please save or cancel your edits first", "error");
      return;
    }
    setCurrentAction("cancel");
    setShowActionDialog(true);
  };

  const handlePendingClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isEditMode) {
      showNotification("Please save or cancel your edits first", "error");
      return;
    }
    setCurrentAction("pending");
    setShowActionDialog(true);
  };

  const handleRejectClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isEditMode) {
      showNotification("Please save or cancel your edits first", "error");
      return;
    }
    setCurrentAction("reject");
    setShowActionDialog(true);
  };

  const handleApproveClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isEditMode) {
      showNotification("Please save your edits first", "error");
      return;
    }
    setCurrentAction("approve");
    setShowActionDialog(true);
  };

  const handleActionConfirm = async () => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    setProcessing(true);

    try {
      if (currentAction === "cancel") {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setIsActionLoading(false);
        setShowActionDialog(false);
        showNotification("Cancelled. Returning to upload.", "info");
        setTimeout(() => {
          handleBackToUpload();
        }, 500);
        return;
      }

      const backendAccuracy =
        invoiceData.accuracy ?? invoiceData.metadata?.accuracy ?? 0;

      const masterData = mapInvoiceToMaster(
        invoiceData,
        comments,
        backendAccuracy,
        originalData,
      );

      const wasAnythingEdited = invoiceData.validations?.some((v) => {
        const original = originalData?.validations?.find(
          (ov) => ov.id === v.id,
        );
        if (!original) return false;
        const currentValue = v.invoiceValue ?? v.value;
        const originalValue = original.value;

        const normalizedCurrent =
          currentValue === null ||
          currentValue === undefined ||
          currentValue === ""
            ? ""
            : currentValue;
        const normalizedOriginal =
          originalValue === null ||
          originalValue === undefined ||
          originalValue === ""
            ? ""
            : originalValue;

        return normalizedCurrent !== normalizedOriginal;
      });

      if (wasAnythingEdited && masterData.human_intervention === "No") {
        masterData.human_intervention = "Yes";
      }

      masterData.inv_verified = invChecked;

      const status = invoiceData.status || "Inward";
      const derivedType = status.toLowerCase();
      masterData.invoice_type = derivedType;

      const currentTimestamp = new Date().toISOString();
      masterData.Approval_Name = approverName;
      masterData.Action_Date = currentTimestamp;

      if (currentAction === "pending") {
        masterData.approval_status = "Pending";
      } else if (currentAction === "reject") {
        masterData.approval_status = "Reject";
      } else if (currentAction === "approve") {
        masterData.approval_status = "Approve";
      }

      await masterDataService.saveApprovedInvoice(masterData);

      setIsActionLoading(false);
      setShowActionDialog(false);

      const messages = {
        pending: `Invoice marked as Pending by ${approverName}! ⏳`,
        reject: `Invoice rejected by ${approverName}! ✗`,
        approve: `Invoice approved by ${approverName}! ✓`,
      };

      const notifTypes = {
        pending: "info",
        reject: "warning",
        approve: "success",
      };

      showNotification(messages[currentAction], notifTypes[currentAction]);
      setTimeout(() => {
        handleBackToUpload();
      }, 1000);
    } catch (error) {
      console.error("❌ Save error:", error);
      showNotification(
        error.message || "Failed to save invoice to database",
        "error",
      );
      setIsActionLoading(false);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-gray-500">
            Loading invoice data...
          </p>
        </div>
      </div>
    );
  }

  if (!invoiceData || !invoiceData.hasData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm mt-10">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
          !
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          {!invoiceData ? "No Data Available" : "No Data Extracted"}
        </h3>
        <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
          {!invoiceData
            ? "Unable to load invoice information."
            : "The OCR engine could not extract any data from this document."}
        </p>
        <button
          onClick={handleBackToUpload}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700"
        >
          {!invoiceData ? "Back to Upload" : "Upload Another Document"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <InvoiceHeader
          fileName={invoiceData.fileName}
          status={invoiceData.status}
          stats={stats}
          accuracy={invoiceData.accuracy}
        />

        <div
          ref={containerRef}
          className="relative flex gap-0 bg-gray-100 rounded-xl p-1"
          style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}
        >
          <div className="flex-shrink-0" style={{ width: `${splitPosition}%` }}>
            <PDFViewer
              fileName={invoiceData.fileName}
              imageFileName={invoiceData.imageFileName}
              base64Data={invoiceData.base64Data}
              isCompact={isCompactPDF}
              onToggleCompact={() => setIsCompactPDF(!isCompactPDF)}
            />
          </div>

          <div
            className={`flex-shrink-0 w-1 relative group cursor-col-resize ${
              isDragging ? "bg-teal-500" : "bg-transparent hover:bg-teal-400/50"
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div
                className={`w-6 h-12 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center transition-all ${
                  isDragging
                    ? "scale-110 border-teal-500"
                    : "group-hover:border-teal-400"
                }`}
              >
                <GripVertical
                  className={`w-4 h-4 ${
                    isDragging
                      ? "text-teal-600"
                      : "text-gray-400 group-hover:text-teal-500"
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-5 space-y-5">
                <div>
                  <ValidationSection
                    validations={invoiceData.validations}
                    isEditMode={isEditMode}
                    onValueChange={handleValueChange}
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">
                      Comments & Notes
                    </h3>
                  </div>
                  <CommentsSection
                    comments={comments}
                    onCommentsChange={handleCommentsChange}
                    disabled={isEditMode}
                  />
                </div>

                <div
                  className={`border rounded-xl p-4 flex items-center justify-between ${
                    invChecked
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="inv-checkbox"
                        checked={invChecked}
                        readOnly
                        disabled
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="inv-checkbox"
                        className={`block text-sm font-bold cursor-not-allowed ${
                          invChecked ? "text-emerald-900" : "text-gray-700"
                        }`}
                      >
                        Invoice Verified (INV)
                      </label>
                      <p className="text-xs text-gray-500">
                        {invChecked
                          ? "Data has been reviewed and modified"
                          : "Marked automatically after saving edits"}
                      </p>
                    </div>
                  </div>
                  {invChecked && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-4">
              <ActionButtons
                onEditOCR={handleEditOCR}
                onCancel={handleCancelClick}
                onPending={handlePendingClick}
                onReject={handleRejectClick}
                onApprove={handleApproveClick}
                disabled={processing}
                isEditMode={isEditMode}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      </div>

      {processing && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 text-center shadow-xl max-w-sm mx-4">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-gray-900">
              Processing Invoice
            </h3>
            <p className="text-sm text-gray-500 mt-2">Saving to database...</p>
          </div>
        </div>
      )}

      <ApproveRejectDialog
        isOpen={showActionDialog}
        onClose={() => {
          if (!isActionLoading) {
            setShowActionDialog(false);
            setCurrentAction(null);
          }
        }}
        onConfirm={handleActionConfirm}
        action={currentAction}
        isLoading={isActionLoading}
      />
    </>
  );
};

export default UploadInvoiceDetail;
