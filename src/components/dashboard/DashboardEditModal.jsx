import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import invoiceService from "../../services/invoiceService";
import ConfirmDialog from "./ConfirmDialog";

const DIRECTIONS = ["inward", "outward", "returnable"];

// ── Same order as view modal ──────────────────────────────────────────────────
const SECTION_ORDER = [
  "document_metadata",
  "issuer_details",
  "person_details",
  "source_destination",
  "transporter_details",
  "items",
  "signatures",
];

const SECTION_LABELS = {
  document_metadata: "Document Metadata",
  issuer_details: "Issuer Details",
  person_details: "Person Details",
  source_destination: "Source & Destination",
  transporter_details: "Transporter Details",
  items: "Items",
  signatures: "Signatures",
};

const fmt = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Single field input ────────────────────────────────────────────────────────
const FieldInput = ({ fieldKey, value, onChange }) => {
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer col-span-full">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600"
        />
        <span className="text-sm text-slate-700">{fmt(fieldKey)}</span>
      </label>
    );
  }

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {fmt(fieldKey)}
      </label>
      <input
        type="text"
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => onChange(fieldKey, e.target.value || null)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all placeholder:text-slate-300"
        placeholder="—"
      />
    </div>
  );
};

// ── Object section editor ─────────────────────────────────────────────────────
const SectionEditor = ({ sectionKey, data, onChange }) => {
  const [open, setOpen] = useState(true);
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const handleField = (key, val) =>
    onChange(sectionKey, { ...data, [key]: val });

  const leafEntries = Object.entries(data).filter(
    ([, v]) => typeof v !== "object" || v === null,
  );

  if (leafEntries.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          {SECTION_LABELS[sectionKey] || fmt(sectionKey)}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {leafEntries.map(([key, val]) => (
            <FieldInput
              key={key}
              fieldKey={key}
              value={val}
              onChange={handleField}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Array section editor (table layout for items) ─────────────────────────────
const ITEM_COLUMNS = [
  { key: "sr_no", label: "SR NO", width: "w-14" },
  { key: "description", label: "Description", width: "w-full" },
  { key: "quantity", label: "Quantity", width: "w-24" },
  { key: "unit", label: "Unit", width: "w-20" },
];

const ArraySectionEditor = ({ sectionKey, data, onChange }) => {
  const [open, setOpen] = useState(true);
  if (!Array.isArray(data)) return null;

  const handleItem = (idx, key, val) =>
    onChange(
      sectionKey,
      data.map((item, i) => (i === idx ? { ...item, [key]: val } : item)),
    );

  const addRow = () => {
    const template = Object.fromEntries(ITEM_COLUMNS.map((c) => [c.key, null]));
    onChange(sectionKey, [...data, template]);
  };

  const removeRow = (idx) =>
    onChange(
      sectionKey,
      data.filter((_, i) => i !== idx),
    );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          {SECTION_LABELS[sectionKey] || fmt(sectionKey)}
          <span className="ml-2 text-slate-400 font-normal normal-case">
            ({data.length} rows)
          </span>
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="p-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {ITEM_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap ${
                        col.key === "description" ? "w-full" : col.width
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                  {/* Remove column */}
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={ITEM_COLUMNS.length + 1}
                      className="px-3 py-6 text-center text-sm text-slate-400"
                    >
                      No rows yet.
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                    >
                      {ITEM_COLUMNS.map((col) => {
                        const val = item?.[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`px-2 py-1.5 align-middle ${
                              col.key === "description" ? "w-full" : col.width
                            }`}
                          >
                            <input
                              type="text"
                              value={
                                val === null || val === undefined
                                  ? ""
                                  : String(val)
                              }
                              onChange={(e) =>
                                handleItem(idx, col.key, e.target.value || null)
                              }
                              className={`px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all placeholder:text-slate-300 ${
                                col.key === "description"
                                  ? "w-full"
                                  : "w-full min-w-[60px]"
                              }`}
                              placeholder="—"
                            />
                          </td>
                        );
                      })}

                      <td className="px-2 py-1.5 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-dashed border-indigo-300 w-full justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
      )}
    </div>
  );
};

// ── Manual entry field editor (one box per key/value pair) ────────────────────
const ManualFieldsEditor = ({ fields, onChange }) => {
  const [confirmId, setConfirmId] = useState(null);

  const updateField = (id, prop, val) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, [prop]: val } : f)));

  const addField = () =>
    onChange([...fields, { id: `field-${Date.now()}`, key: "", value: "" }]);

  const removeField = (id) => onChange(fields.filter((f) => f.id !== id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div
            key={f.id}
            className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2 relative bg-slate-50/50"
          >
            <button
              type="button"
              onClick={() => setConfirmId(f.id)}
              className="absolute top-2 right-2 p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Remove field"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              value={f.key}
              onChange={(e) => updateField(f.id, "key", e.target.value)}
              placeholder="Key"
              className="w-full pr-7 px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-500 uppercase tracking-wide bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
            />
            <input
              type="text"
              value={f.value}
              onChange={(e) => updateField(f.id, "value", e.target.value)}
              placeholder="Value"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addField}
        className="mt-3 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-dashed border-indigo-300 w-full justify-center transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Field
      </button>

      <ConfirmDialog
        isOpen={Boolean(confirmId)}
        title="Remove Field?"
        message="Are you sure you want to remove this field?"
        onConfirm={() => {
          removeField(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
        confirmLabel="Remove"
        loadingLabel="Removing..."
      />
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const DashboardEditModal = ({ isOpen, onClose, record, onSave }) => {
  const [direction, setDirection] = useState("inward");
  const [documentType, setDocumentType] = useState("");
  const [extracted, setExtracted] = useState({});
  const [manualFields, setManualFields] = useState([]);
  const [isManual, setIsManual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    if (isOpen && record) {
      loadRecord();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, record]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const id = record.ID || record.id;
      const full = await invoiceService.getRecordById(id);
      const manual = full.entry_type === "manual";
      setIsManual(manual);
      setDirection(full.raw?.direction || "inward");
      setDocumentType(full.raw?.document_type || "");
      setExtracted(full.raw?.extracted_data || {});
      setManualFields(
        (full.manual_fields || []).map((f, i) => ({
          id: `field-${i}-${Date.now()}`,
          key: f.key,
          value: f.value,
        })),
      );
    } catch {
      const manual = record.entry_type === "manual";
      setIsManual(manual);
      setDirection(record.inward_outward?.toLowerCase() || "inward");
      setDocumentType(record.document_type || "");
      setExtracted(record.extracted_data || {});
      setManualFields(
        (record.manual_fields || []).map((f, i) => ({
          id: `field-${i}-${Date.now()}`,
          key: f.key,
          value: f.value,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSection = (key, val) =>
    setExtracted((prev) => ({ ...prev, [key]: val }));

  const handleSaveClick = () => {
    if (isSaving) return;
    setConfirmSaveOpen(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setConfirmSaveOpen(false);
    setIsSaving(true);
    try {
      const id = record.ID || record.id;
      if (isManual) {
        await invoiceService.updateRecord(id, {
          manual_fields: manualFields
            .filter((f) => f.key.trim())
            .map((f) => ({ key: f.key.trim(), value: f.value })),
        });
      } else {
        await invoiceService.updateRecord(id, {
          direction,
          document_type: documentType,
          extracted_data: extracted,
        });
      }
      if (onSave) await onSave();
      onClose();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Ordered keys — known first, then any extras
  const knownSet = new Set(SECTION_ORDER);
  const extraKeys = Object.keys(extracted).filter((k) => !knownSet.has(k));
  const orderedKeys = [...SECTION_ORDER, ...extraKeys];

  const docTypeDisplay = (documentType || "-").toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isSaving ? undefined : onClose}
      />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Edit Record</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              {isManual
                ? "MANUAL ENTRY"
                : `${(record?.inward_outward || direction || "-").toUpperCase()} • ${docTypeDisplay}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-500 mt-3">Loading record...</p>
            </div>
          ) : isManual ? (
            <ManualFieldsEditor fields={manualFields} onChange={setManualFields} />
          ) : (
            <>
              {/* ── Direction + Doc Type side by side ── */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Direction */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                    Direction
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {DIRECTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDirection(d)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                          direction === d
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-white border border-slate-300 text-slate-600 hover:border-indigo-400"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                    Document Type
                  </label>
                  <input
                    type="text"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    placeholder="e.g. Security Gate Pass"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 bg-white"
                  />
                </div>
              </div>

              {/* ── Extracted data in document order ── */}
              {orderedKeys.map((key) => {
                const val = extracted[key];
                if (val === undefined) return null;
                return Array.isArray(val) ? (
                  <ArraySectionEditor
                    key={key}
                    sectionKey={key}
                    data={val}
                    onChange={handleSection}
                  />
                ) : typeof val === "object" && val !== null ? (
                  <SectionEditor
                    key={key}
                    sectionKey={key}
                    data={val}
                    onChange={handleSection}
                  />
                ) : null;
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving || loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmSaveOpen}
        title="Save Changes?"
        message="Are you sure you want to save the changes made to this record?"
        onConfirm={handleSave}
        onCancel={() => setConfirmSaveOpen(false)}
        isLoading={isSaving}
        confirmLabel="Save"
        loadingLabel="Saving..."
        confirmColor="indigo"
      />
    </div>,
    document.body,
  );
};

export default DashboardEditModal;
