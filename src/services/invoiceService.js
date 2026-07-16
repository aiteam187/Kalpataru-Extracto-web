import api from "./api";

// ── Helper: case-insensitive partial match across manual fields array ────────
const resolveFromManualFields = (fields, possibleKeys) => {
  if (!Array.isArray(fields)) return null;
  for (const pk of possibleKeys) {
    const found = fields.find(
      (f) => f.key?.toLowerCase().includes(pk.toLowerCase())
    );
    if (found?.value) return found.value.trim();
  }
  return null;
};

// ── Helper: pull a company/vendor name from any structure Groq might return ─
const resolveVendorName = (extracted_data, manual_fields) => {
  if (manual_fields) {
    const manualVal = resolveFromManualFields(manual_fields, [
      "vendor", "supplier", "company", "party", "from", "issuer"
    ]);
    if (manualVal) return manualVal;
  }
  if (!extracted_data) return "-";

  // extracted_data.issuer can itself be a nested object (name/address/gstin/...)
  // rather than a plain string, depending on how the LLM structured this
  // document — never return it directly as a fallback value below.
  const issuer = extracted_data.issuer_details || extracted_data.seller || extracted_data.from_party ||
    (typeof extracted_data.issuer === "object" ? extracted_data.issuer : null) || {};
  const meta = extracted_data.document_metadata || {};
  const transporter = extracted_data.transporter_details || {};
  const src = extracted_data.source_destination || {};

  const resolved =
    // Flat top-level (new universal prompt outputs)
    extracted_data.supplier_name ||
    extracted_data.vendor_name ||
    extracted_data.company_name ||
    extracted_data.party_name ||
    (typeof extracted_data.issuer === "string" ? extracted_data.issuer : null) ||
    // Nested issuer block (old or new)
    issuer.company_name_printed_on_the_letterhead ||
    issuer.company_name ||
    issuer.name ||
    issuer.vendor_name ||
    issuer.party_name ||
    issuer.issued_by ||
    issuer.issued_to ||
    issuer.supplier_name ||
    issuer.consignor ||
    issuer.consignee ||
    issuer.firm_name ||
    issuer.organisation_name ||
    issuer.organization_name ||
    meta.issuer ||
    meta.vendor_name ||
    meta.company_name ||
    meta.party_name ||
    meta.supplier_name ||
    src.source_site ||
    "-";

  // Final safety net — a table cell must never receive a raw object,
  // regardless of what shape a future document's extracted_data takes.
  return typeof resolved === "string" ? resolved : "-";
};

// ── Helper: pull document / invoice number ────────────────────────────────────
const resolveDocumentNumber = (extracted_data, fallbackId, manual_fields) => {
  if (manual_fields) {
    const manualVal = resolveFromManualFields(manual_fields, [
      "invoice no", "invoice number", "challan no", "gate pass no", "doc no", "document no", "receipt no"
    ]);
    if (manualVal) return manualVal;
  }
  if (!extracted_data) return fallbackId?.slice(0, 8) || "-";

  // Nested (legacy gate pass format)
  const meta = extracted_data.document_metadata || {};

  return (
    // Flat top-level (new universal prompt)
    extracted_data.document_number ||
    extracted_data.invoice_no ||
    extracted_data.invoice_number ||
    extracted_data.challan_no ||
    extracted_data.gate_pass_no ||
    extracted_data.receipt_no ||
    extracted_data.po_number ||
    // Nested legacy
    meta.gate_pass_number ||
    meta.form_number ||
    meta.mtn_number ||
    meta.document_number ||
    meta.invoice_number ||
    meta.challan_number ||
    meta.lr_number ||
    extracted_data.document_number ||
    fallbackId?.slice(0, 8) ||
    "-"
  );
};

// ─── Helper: pull grand total ────────────────────────────────────────────────
const resolveAmount = (extracted_data, manual_fields) => {
  if (manual_fields) {
    const manualVal = resolveFromManualFields(manual_fields, [
      "amount", "total", "grand total", "net amount", "value", "price"
    ]);
    if (manualVal) return manualVal;
  }
  if (!extracted_data) return "-";

  const totals = extracted_data.totals_and_summary || {};

  return (
    totals.grand_total ||
    totals.total ||
    totals.net_total ||
    totals.amount ||
    extracted_data.grand_total ||
    extracted_data.total_amount ||
    "-"
  );
};

// ── Invoices for the head office print "HO" as the site — display the full
// registered company name instead so it reads consistently on the dashboard.
// Also guards against a non-string value (e.g. a nested object) ever
// reaching a table cell, which would crash the render.
const normalizeProjectSite = (site) => {
  if (typeof site !== "string" || !site) return "-";
  return site.trim().toUpperCase() === "HO" ? "Kalpataru Pvt Ltd" : site;
};

// ─── Helper: pull project site ───────────────────────────────────────────────
const resolveProjectSite = (extracted_data, manual_fields) => {
  if (manual_fields) {
    const manualVal = resolveFromManualFields(manual_fields, [
      "project", "site", "project site", "location", "where"
    ]);
    if (manualVal) return normalizeProjectSite(manualVal);
  }
  if (!extracted_data) return "-";

  const meta = extracted_data.document_metadata || {};
  const src = extracted_data.source_destination || {};

  return normalizeProjectSite(
    meta.project_site ||
    src.source_site ||
    meta.site ||
    extracted_data.project_site ||
    "-"
  );
};

// ─── Main record mapper ──────────────────────────────────────────────────────
const mapRecord = (r) => {
  const transporter = r.extracted_data?.transporter_details || {};
  const src_dst = r.extracted_data?.source_destination || {};

  return {
    ID: r.id,
    id: r.id,
    entry_type: r.entry_type || "automatic",
    manual_fields: r.manual_fields || null,
    inward_outward: r.direction
      ? r.direction.charAt(0).toUpperCase() + r.direction.slice(1)
      : resolveFromManualFields(r.manual_fields, ["direction", "type"]) || "-",
    document_type:
      r.document_type ||
      r.extracted_data?.document_metadata?.document_type ||
      "-",
    vendor_name: resolveVendorName(r.extracted_data, r.manual_fields),
    project_site: resolveProjectSite(r.extracted_data, r.manual_fields),
    destination_site: src_dst.destination_site || resolveFromManualFields(r.manual_fields, ["destination", "to"]) || "-",
    invoice_number: resolveDocumentNumber(r.extracted_data, r.id, r.manual_fields),
    invoice_date: r.created_at || null,
    updated_at: r.updated_at || null,
    invoice_amount: resolveAmount(r.extracted_data, r.manual_fields),
    approval_status: r.success ? "Approve" : "Reject",
    accuracy: r.success ? 100 : 0,
    vehicle_number: transporter.vehicle_number || resolveFromManualFields(r.manual_fields, ["vehicle", "truck", "car", "tempo"]) || "-",
    driver_name: transporter.driver_name || resolveFromManualFields(r.manual_fields, ["driver", "person"]) || "-",
    action_date: r.created_at,
    challan_image_url: r.challan_image_url,
    vehicle_front_url: r.vehicle_front_url,
    vehicle_back_url: r.vehicle_back_url,
    extracted_data: r.extracted_data,
    raw: r,
  };
};

// ─── Stats calculator ────────────────────────────────────────────────────────
const calculateStats = (records) => {
  const now = new Date();
  const total = records.length;
  const inward = records.filter(
    (r) => r.inward_outward?.toLowerCase() === "inward",
  ).length;
  const outward = records.filter(
    (r) => r.inward_outward?.toLowerCase() === "outward",
  ).length;
  const returnable = records.filter(
    (r) => r.inward_outward?.toLowerCase() === "returnable",
  ).length;

  const manual = records.filter(
    (r) => r.entry_type?.toLowerCase() === "manual",
  ).length;

  const today = records.filter((r) => {
    if (!r.action_date) return false;
    const d = new Date(r.action_date);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  return [
    { label: "Total Records", value: String(total) },
    { label: "Inward", value: String(inward) },
    { label: "Outward", value: String(outward) },
    { label: "Returnable", value: String(returnable) },
    { label: "Manual", value: String(manual) },
    { label: "Today", value: String(today) },
  ];
};

// ─── Service class ───────────────────────────────────────────────────────────
class InvoiceService {
  async _fetchHistory(params = {}) {
    const query = {};
    if (params.direction) query.direction = params.direction;

    // Correct endpoint: /history (not /history/all)
    const response = await api.get("/history", { params: query });
    return (response.data.records || []).map(mapRecord);
  }

  async getDashboardStats(params = {}) {
    try {
      const records = await this._fetchHistory(params);
      return calculateStats(records);
    } catch (error) {
      console.error("❌ Error fetching stats:", error);
      return calculateStats([]);
    }
  }

  async getRecords(params = {}) {
    try {
      const records = await this._fetchHistory(params);
      return { data: records, total: records.length, page: 1, totalPages: 1 };
    } catch (error) {
      console.error("❌ Error fetching records:", error);
      throw error;
    }
  }

  async getRecordById(id) {
    try {
      const response = await api.get(`/history/${id}`);
      return mapRecord(response.data);
    } catch (error) {
      console.error("❌ Error fetching record:", error);
      throw error;
    }
  }

  async updateRecord(id, data) {
    try {
      const body = {};
      if (data.direction) body.direction = data.direction.toLowerCase();
      if (data.document_type) body.document_type = data.document_type;
      if (data.extracted_data) body.extracted_data = data.extracted_data;
      if (data.manual_fields) body.manual_fields = data.manual_fields;

      const response = await api.patch(`/history/${id}`, body);
      return response.data;
    } catch (error) {
      console.error("❌ Error updating record:", error);
      throw error;
    }
  }

  async deleteRecord(id) {
    try {
      const response = await api.delete(`/history/${id}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error deleting record:", error);
      throw error;
    }
  }

  async syncData() {
    return {
      success: true,
      message: "Sync completed",
      timestamp: new Date().toISOString(),
    };
  }
  async getSyncStatus() {
    return { lastSync: new Date().toISOString() };
  }
  async uploadInvoice() {
    return { success: false, message: "Use the Tab app to upload invoices" };
  }
  async updateRecordStatus() {
    return { success: false, message: "Not supported" };
  }
  async exportRecords() {
    return new Blob(["No data"], { type: "text/csv" });
  }

  getEmptyStats() {
    return calculateStats([]);
  }
}

export default new InvoiceService();
