import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  AlertCircle,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Pencil,
} from "lucide-react";
import invoiceService from "../../services/invoiceService";

// ── Section order matching the physical document layout ──────────────────────
const SECTION_ORDER = [
  "document_metadata",
  "issuer_details",
  "person_details",
  "source_destination",
  "transporter_details",
  "items",
  "signatures",
];

// ── Label overrides for section titles ───────────────────────────────────────
const SECTION_LABELS = {
  document_metadata: "Document Metadata",
  issuer_details: "Issuer Details",
  person_details: "Person Details",
  source_destination: "Source & Destination",
  transporter_details: "Transporter Details",
  items: "Items",
  signatures: "Signatures",
};

// ── Fixed column definition for items table ───────────────────────────────────
const ITEM_COLUMNS = [
  { key: "sr_no", label: "SR NO" },
  { key: "description", label: "Description" },
  { key: "quantity", label: "Quantity" },
  { key: "unit", label: "Unit" },
];

const fmt = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
    return new Date(value).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

  // Array of objects (like sub-tables)
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null
  ) {
    const cols = Array.from(new Set(value.flatMap((r) => Object.keys(r || {}))));
    return (
      <div className="overflow-x-auto mt-1 border border-gray-150 rounded-lg shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-2 py-1.5 text-left font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {fmt(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                {cols.map((c) => (
                  <td
                    key={c}
                    className="px-2 py-1.5 text-gray-800 align-top border-r border-gray-100 last:border-r-0"
                  >
                    {row[c] == null ? "-" : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return (
      <ul className="list-disc list-inside space-y-0.5 mt-1">
        {value.map((item, i) => (
          <li key={i} className="text-sm text-gray-700">
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-1 pl-2 border-l border-gray-200">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">{fmt(k)}: </span>
            <span className="text-gray-800">{v == null ? "-" : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return String(value);
};

// ── Section component ────────────────────────────────────────────────────────
const Section = ({ title, data }) => {
  const [open, setOpen] = useState(true);

  if (!data) return null;
  if (
    !Array.isArray(data) &&
    typeof data === "object" &&
    Object.keys(data).length === 0
  )
    return null;

  const isTable =
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null;

  const isPrimitiveList = Array.isArray(data) && !isTable;

  // Resolve columns dynamically from all objects in the array
  let tableColumns = [];
  if (isTable) {
    const uniqueKeys = Array.from(new Set(data.flatMap((r) => Object.keys(r || {}))));
    tableColumns = uniqueKeys.map((k) => ({ key: k, label: fmt(k) }));
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 bg-white shadow-sm">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-150"
      >
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
          {title}
        </span>
        {open ? (
          <ArrowUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ArrowDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="p-4">
          {/* Dynamic table layout */}
          {isTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {tableColumns.map((col) => (
                      <th
                        key={col.key}
                        className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-3 py-2 border border-gray-200 whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                    >
                      {tableColumns.map((col) => {
                        const val = item?.[col.key];
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-2 border border-gray-200 text-gray-800 align-top"
                          >
                            {val == null ? "-" : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Array of primitives → list */}
          {isPrimitiveList && (
            <ul className="list-disc list-inside space-y-1">
              {data.map((item, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {String(item)}
                </li>
              ))}
            </ul>
          )}

          {/* Object → key-value grid */}
          {!Array.isArray(data) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {Object.entries(data).map(([key, val]) => (
                <div key={key}>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    {fmt(key)}
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 break-words">
                    {formatValue(val)}
                  </dd>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const DashboardViewModal = ({ isOpen, onClose, recordId, onEdit }) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && recordId) {
      fetchRecord();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, recordId]);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoiceService.getRecordById(recordId);
      setRecord(data);
    } catch (err) {
      setError(err.message || "Failed to load record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const extracted = record?.extracted_data || {};
  const direction = record?.inward_outward || record?.direction || "-";
  const docType = (
    record?.document_type ||
    extracted?.document_metadata?.document_type ||
    "-"
  ).toUpperCase();
  // NOTE: invoiceService.mapRecord() does not preserve a "created_at" key
  // on the mapped record — it only sets "action_date" (and "invoice_date"),
  // both derived from the raw API's created_at. Reading record.created_at
  // directly here always returns undefined, which is why Approved Date /
  // Approved Time were showing "-". Use action_date instead.
  const approvedAt = record?.action_date
    ? new Date(record.action_date).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    : "-";
  const approvedDateOnly = record?.action_date
    ? new Date(record.action_date).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";
  const approvedTimeOnly = record?.action_date
    ? new Date(record.action_date).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "-";

  const knownSet = new Set(SECTION_ORDER);
  const extraKeys = Object.keys(extracted).filter((k) => !knownSet.has(k));
  const orderedKeys = [...SECTION_ORDER, ...extraKeys];

  const isManual = record?.entry_type === "manual";
  const manualFields = record?.manual_fields || [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full max-w-3xl max-h-[88vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-600">
          <div>
            <h2 className="text-base font-bold text-white">Record Details</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              {direction} &bull; {docType} &bull; {approvedAt}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {onEdit && record && (
              <button
                onClick={() => onEdit(record)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Edit record"
              >
                <Pencil className="w-4.5 h-4.5 text-white" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchRecord}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
              >
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && record && (
            <>
              {/* Created date/time — prominent dedicated card */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 bg-white">
                <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Approved Date
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {approvedDateOnly}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Approved Time
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {approvedTimeOnly}
                    </dd>
                  </div>
                </div>
              </div>

              {isManual ? (
                <div className="mb-3">
                  <div className="px-1 pb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Manual Entry Fields
                    </span>
                  </div>
                  {manualFields.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg">
                      No fields were entered.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {manualFields.map((f, i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-lg bg-white p-3.5"
                        >
                          <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 break-words">
                            {f.key}
                          </dt>
                          <dd className="text-sm font-medium text-gray-900 break-words">
                            {f.value?.trim() ? f.value : "-"}
                          </dd>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                (() => {
                  const sections = [];
                  const flatFields = [];

                  const META_KEYS = new Set(["document_type", "entry_type"]);
                  const KNOWN_SECTION_KEYS = new Set([
                    "document_metadata",
                    "issuer_details",
                    "person_details",
                    "source_destination",
                    "transporter_details",
                    "items",
                    "signatures",
                  ]);

                  for (const [key, val] of Object.entries(extracted)) {
                    if (META_KEYS.has(key)) continue;
                    if (val === null || val === undefined || val === "") continue;

                    const isSection =
                      KNOWN_SECTION_KEYS.has(key) ||
                      (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 1) ||
                      (Array.isArray(val) && val.length > 0 && typeof val[0] === "object");

                    if (isSection) {
                      sections.push({ key, label: SECTION_LABELS[key] || fmt(key), data: val });
                    } else {
                      flatFields.push({ key, label: fmt(key), value: val });
                    }
                  }

                  return (
                    <>
                      {flatFields.length > 0 && (
                        <Section
                          title="Document Details"
                          data={Object.fromEntries(flatFields.map((f) => [f.key, f.value]))}
                        />
                      )}
                      {sections.map(({ key, label, data }) => (
                        <Section key={key} title={label} data={data} />
                      ))}
                    </>
                  );
                })()
              )}

              {/* Images */}
              {(record.challan_image_url ||
                record.vehicle_front_url ||
                record.vehicle_back_url) && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                  <div className="px-4 py-3 bg-gray-50">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Images
                    </span>
                  </div>
                  <div className="p-4 flex gap-4 flex-wrap">
                    {[
                      { label: "Challan", url: record.challan_image_url },
                      { label: "Vehicle Front", url: record.vehicle_front_url },
                      { label: "Vehicle Back", url: record.vehicle_back_url },
                    ]
                      .filter(({ url }) => url)
                      .map(({ label, url }) => (
                        <div key={label} className="text-center">
                          <a href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt={label}
                              className="h-32 w-auto rounded border border-gray-200 object-cover hover:opacity-80 transition-opacity"
                            />
                          </a>
                          <p className="text-xs text-gray-500 mt-1">{label}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 bg-white border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DashboardViewModal;
