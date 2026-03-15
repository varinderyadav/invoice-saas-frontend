import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { getCompanies } from "../api/companyService";
import {
  createInvoice,
  createInvoiceItem,
  deleteInvoice,
  deleteInvoiceItem,
  downloadInvoicePdf,
  sendInvoiceEmail,
  getInvoiceById,
  getInvoices,
} from "../api/invoiceService";

function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
}

function toNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}

function formatCurrency(value) {
  const numeric = toNumber(value);
  if (numeric === 0) return "Rs 0";
  return `Rs ${numeric.toLocaleString()}`;
}

function formatAmount(invoice) {
  return formatCurrency(invoice?.item_total ?? 0);
}

function formatError(error) {
  const detail = error?.response?.data;
  if (!detail) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (detail.detail) return detail.detail;

  const firstKey = Object.keys(detail)[0];
  if (firstKey && Array.isArray(detail[firstKey]) && detail[firstKey][0]) {
    return `${firstKey}: ${detail[firstKey][0]}`;
  }

  return "Request failed. Please check your input.";
}

function formatDate(value) {
  if (!value) return "-";
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return value;
  return dateObj.toLocaleDateString();
}

function calculateItemMeta(item) {
  const quantity = toNumber(item?.quantity);
  const unitPrice = toNumber(item?.unit_price ?? item?.unitPrice ?? item?.price);
  const gstPercent = toNumber(item?.gst_rate ?? item?.gst_percentage ?? item?.gst_percent ?? item?.gst);
  const taxableAmount = quantity * unitPrice;
  const gstAmount =
    item?.gst_amount !== undefined
      ? toNumber(item.gst_amount)
      : (taxableAmount * gstPercent) / 100;
  const total = item?.total_amount !== undefined ? toNumber(item.total_amount) : taxableAmount + gstAmount;

  return { quantity, unitPrice, gstPercent, gstAmount, total };
}

function getItemName(item) {
  return item?.item_name || item?.name || "-";
}

function getItemDescription(item) {
  return item?.description || "";
}

function getClientMobileNumber(invoice) {
  return (
    invoice?.client?.mobile_number ||
    invoice?.client_mobile_number ||
    invoice?.client_phone ||
    invoice?.client?.phone ||
    invoice?.client?.phone_number ||
    ""
  );
}

function normalizePhoneNumber(value) {
  return (value || "").replace(/[^\d]/g, "");
}

async function getClients() {
  const response = await api.get("clients/");
  return response.data;
}

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    client: "",
    invoiceDate: "",
    company: "",
    status: "due",
    selected_template: "default",
  });

  const [itemFormData, setItemFormData] = useState({
    item_name: "",
    description: "",
    quantity: "1",
    unit_price: "",
    gst_percentage: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const [invoiceResponse, companyResponse, clientResponse] = await Promise.all([
        getInvoices(),
        getCompanies(),
        getClients(),
      ]);
      const companyList = normalizeList(companyResponse);
      const clientList = normalizeList(clientResponse);

      setInvoices(normalizeList(invoiceResponse));
      setCompanies(companyList);
      setClients(clientList);

      setFormData((prev) => ({
        ...prev,
        company: prev.company || (companyList[0] ? String(companyList[0].id) : ""),
        client: prev.client || (clientList[0] ? String(clientList[0].id) : ""),
      }));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceDetails = async (invoiceId) => {
    try {
      setItemsLoading(true);
      setError("");
      setSuccessMessage("");
      const invoiceDetail = await getInvoiceById(invoiceId);
      const itemList = normalizeList(invoiceDetail?.invoice_items ?? invoiceDetail?.items ?? []);

      setSelectedInvoice(invoiceDetail);
      setInvoiceItems(itemList);
      setInvoices((prev) =>
        prev.map((invoice) => (invoice.id === invoiceDetail.id ? { ...invoice, ...invoiceDetail } : invoice))
      );
    } catch (err) {
      setError(formatError(err));
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemInputChange = (event) => {
    const { name, value } = event.target;
    setItemFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData((prev) => ({
      ...prev,
      invoiceDate: "",
      status: "due",
      selected_template: "default",
    }));
  };

  const closeInvoiceDetails = () => {
    setIsDetailsOpen(false);
    setIsItemModalOpen(false);
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
    setInvoiceItems([]);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setItemFormData({
      item_name: "",
      description: "",
      quantity: "1",
      unit_price: "",
      gst_percentage: "",
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createInvoice({
        company: Number(formData.company),
        client: Number(formData.client),
        invoice_date: formData.invoiceDate,
        status: formData.status,
        selected_template: formData.selected_template || "default",
      });
      closeModal();
      await loadData();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      setError("");
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));

      if (selectedInvoiceId === id) {
        closeInvoiceDetails();
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDetails = async (invoice) => {
    setSelectedInvoiceId(invoice.id);
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
    await loadInvoiceDetails(invoice.id);
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();
    if (!selectedInvoiceId) return;

    try {
      setItemSubmitting(true);
      setError("");
      setSuccessMessage("");

      await createInvoiceItem(selectedInvoiceId, itemFormData);
      closeItemModal();
      await loadInvoiceDetails(selectedInvoiceId);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!selectedInvoiceId) return;

    try {
      setDeletingItemId(itemId);
      setError("");
      setSuccessMessage("");
      await deleteInvoiceItem(itemId);
      await loadInvoiceDetails(selectedInvoiceId);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!selectedInvoiceId) return;

    try {
      setDownloadingPdf(true);
      setError("");
      setSuccessMessage("");
      const response = await downloadInvoicePdf(selectedInvoiceId);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers?.["content-disposition"] || "";
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      const fallbackFileName = `invoice-${selectedInvoice?.invoice_no || selectedInvoiceId}.pdf`;
      const fileName = fileNameMatch?.[1] || fallbackFileName;

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendInvoiceEmail = async () => {
    if (!selectedInvoiceId) return;

    try {
      setSendingEmail(true);
      setError("");
      setSuccessMessage("");
      await sendInvoiceEmail(selectedInvoiceId);
      setSuccessMessage("Invoice sent to client email");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    const rawPhone = getClientMobileNumber(selectedInvoice);
    const phone = normalizePhoneNumber(rawPhone);
    if (!phone) {
      setError("Client mobile number is missing. Add a mobile number to send WhatsApp.");
      return;
    }

    const invoiceNumber = selectedInvoice?.invoice_no || selectedInvoice?.id || selectedInvoiceId;
    const totalAmount = formatCurrency(invoiceTotals.total);
    const invoiceLink = `${window.location.origin}/invoice/${invoiceNumber}`;

    const message = `Hello,

Your invoice is ready.

Invoice Number: ${invoiceNumber}
Total Amount: ${totalAmount}

View Invoice:
${invoiceLink}`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const invoiceTotals = useMemo(() => {
    const subtotalAmount = selectedInvoice?.item_subtotal_amount ?? 0;
    const subtotalGst = selectedInvoice?.item_subtotal_gst ?? 0;
    const total = selectedInvoice?.item_total ?? 0;

    return {
      subtotalAmount,
      subtotalGst,
      total,
    };
  }, [selectedInvoice]);

  const statusFilter = useMemo(() => {
    const rawStatus = searchParams.get("status");
    return rawStatus ? rawStatus.toLowerCase() : "";
  }, [searchParams]);

  const filteredInvoices = useMemo(() => {
    if (!statusFilter) return invoices;
    if (statusFilter === "paid") {
      return invoices.filter((invoice) => (invoice?.status || "").toLowerCase() === "paid");
    }
    if (statusFilter === "due" || statusFilter === "pending") {
      return invoices.filter((invoice) => {
        const status = (invoice?.status || "").toLowerCase();
        return status === "due" || status === "pending";
      });
    }
    return invoices.filter((invoice) => (invoice?.status || "").toLowerCase() === statusFilter);
  }, [invoices, statusFilter]);

  const filterLabel = useMemo(() => {
    if (!statusFilter) return "";
    if (statusFilter === "paid") return "Paid";
    if (statusFilter === "due" || statusFilter === "pending") return "Pending";
    return statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
  }, [statusFilter]);

  const clearFilter = () => {
    setSearchParams({});
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="mt-2 text-sm text-slate-600">Manage invoice records and status updates.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Create Invoice
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-emerald-600">{successMessage}</p> : null}
      {filterLabel ? (
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            Filtered: {filterLabel}
            <button
              type="button"
              onClick={clearFilter}
              className="rounded-full px-1 text-slate-500 transition hover:text-slate-800"
              aria-label="Clear filter"
            >
              x
            </button>
          </span>
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice ID</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-slate-500">
                  Loading invoices...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-slate-500">
                  No invoices found.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 text-sm text-slate-800">{invoice.invoice_no || invoice.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{invoice.client_name || invoice.client || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{invoice.company_name || invoice.company || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(invoice)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                      {invoice.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatDate(invoice.invoice_date || invoice.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(invoice)}
                        className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(invoice.id)}
                        disabled={deletingId === invoice.id}
                        className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        {deletingId === invoice.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Create Invoice</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="company">
                  Company
                </label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                >
                  {companies.length === 0 ? <option value="">No companies available</option> : null}
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.business_name || `Company ${company.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="client">
                  Client
                </label>
                <select
                  id="client"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                >
                  {clients.length === 0 ? <option value="">No clients available</option> : null}
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.business_name || `Client ${client.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="invoiceDate">
                  Invoice Date
                </label>
                <input
                  id="invoiceDate"
                  name="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  <option value="due">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="selected_template">
                  Selected Template (optional)
                </label>
                <input
                  id="selected_template"
                  name="selected_template"
                  type="text"
                  value={formData.selected_template}
                  onChange={handleInputChange}
                  placeholder="default"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDetailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Invoice Details</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Invoice #{selectedInvoice?.invoice_no || selectedInvoice?.id || selectedInvoiceId}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInvoiceDetails}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Item Subtotal</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(invoiceTotals.subtotalAmount)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Item GST Subtotal</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(invoiceTotals.subtotalGst)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Amount</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(invoiceTotals.total)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Item Details</p>
              {itemsLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading item details...</p>
              ) : invoiceItems.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No items added yet</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {invoiceItems.map((item) => {
                    const itemMeta = calculateItemMeta(item);
                    return (
                      <span
                        key={`summary-${item.id}`}
                        className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
                      >
                        {getItemName(item)} (Qty: {itemMeta.quantity})
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900">Invoice Items</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendInvoiceEmail}
                  disabled={sendingEmail}
                  className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                >
                  {sendingEmail ? "Sending..." : "Send Invoice"}
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.5 8.5 0 0 1-12.57 7.38L3 20l1.12-3.28A8.5 8.5 0 1 1 21 11.5Z" />
                    </svg>
                    Send WhatsApp
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingPdf}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {downloadingPdf ? "Generating PDF..." : "Download Invoice"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(true)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Add Item
                </button>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Item Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Unit Price</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">GST</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-slate-500">
                        Loading items...
                      </td>
                    </tr>
                  ) : invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-slate-500">
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item) => {
                      const itemMeta = calculateItemMeta(item);
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-slate-800">
                            <p>{getItemName(item)}</p>
                            {getItemDescription(item) ? (
                              <p className="mt-0.5 text-xs text-slate-500">{getItemDescription(item)}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{itemMeta.quantity}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(itemMeta.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{itemMeta.gstPercent}%</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(itemMeta.total)}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={deletingItemId === item.id}
                              className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                            >
                              {deletingItemId === item.id ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {isItemModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Item</h2>
              <button
                type="button"
                onClick={closeItemModal}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="item_name">
                  Item Name
                </label>
                <input
                  id="item_name"
                  name="item_name"
                  type="text"
                  value={itemFormData.item_name}
                  onChange={handleItemInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={itemFormData.description}
                  onChange={handleItemInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="quantity">
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="1"
                  min="1"
                  value={itemFormData.quantity}
                  onChange={handleItemInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="unit_price">
                  Unit Price
                </label>
                <input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemFormData.unit_price}
                  onChange={handleItemInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="gst_percentage">
                  GST %
                </label>
                <input
                  id="gst_percentage"
                  name="gst_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemFormData.gst_percentage}
                  onChange={handleItemInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={itemSubmitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {itemSubmitting ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
