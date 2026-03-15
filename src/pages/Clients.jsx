import { useEffect, useMemo, useState } from "react";
import { getCompanies } from "../api/companyService";
import { createClient, deleteClient, getClients, updateClient } from "../api/clientService";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
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

function getClientName(client) {
  return client?.business_name || client?.name || "-";
}

function getClientPhone(client) {
  return client?.mobile_number || "-";
}

function getCompanyName(companyId, companies) {
  if (!companyId) return "-";
  const match = companies.find((company) => String(company.id) === String(companyId));
  return match?.business_name || match?.name || companyId;
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [formData, setFormData] = useState({
    business_name: "",
    email: "",
    address: "",
    mobile_number: "",
    gst_number: "",
    state: "",
    city: "",
    pincode: "",
    company: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const [clientResponse, companyResponse] = await Promise.all([getClients(), getCompanies()]);
      const companyList = normalizeList(companyResponse);
      setClients(normalizeList(clientResponse));
      setCompanies(companyList);
      setFormData((prev) => ({
        ...prev,
        company: prev.company || (companyList[0] ? String(companyList[0].id) : ""),
      }));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tableRows = useMemo(() => clients, [clients]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      business_name: "",
      email: "",
      address: "",
      mobile_number: "",
      gst_number: "",
      state: "",
      city: "",
      pincode: "",
      company: companies[0] ? String(companies[0].id) : "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      business_name: client?.business_name || client?.name || "",
      email: client?.email || "",
      mobile_number: client?.mobile_number || "",
      gst_number: client?.gst_number || "",
      state: client?.state || "",
      city: client?.city || "",
      pincode: client?.pincode || "",
      address: client?.address || "",
      company: client?.company ? String(client.company) : "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      business_name: formData.business_name,
      email: formData.email,
      mobile_number: formData.mobile_number,
      gst_number: formData.gst_number || null,
      state: formData.state,
      city: formData.city,
      pincode: formData.pincode,
      address: formData.address,
      company: formData.company ? Number(formData.company) : null,
    };

    try {
      if (editingClient?.id) {
        await updateClient(editingClient.id, payload);
        setSuccessMessage("Client updated successfully.");
      } else {
        await createClient(payload);
        setSuccessMessage("Client created successfully.");
      }
      closeModal();
      await loadData();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clientId) => {
    try {
      setDeletingId(clientId);
      setError("");
      await deleteClient(clientId);
      setClients((prev) => prev.filter((client) => client.id !== clientId));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="mt-2 text-sm text-slate-600">Manage client records and contact details.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Add Client
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-emerald-600">{successMessage}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Client Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">GST</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Location</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-slate-500">
                  Loading clients...
                </td>
              </tr>
            ) : tableRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-slate-500">
                  No clients found.
                </td>
              </tr>
            ) : (
              tableRows.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 text-sm text-slate-800">{getClientName(client)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{client?.email || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{getClientPhone(client)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{client?.gst_number || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {client?.company_name || getCompanyName(client?.company, companies)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {[client?.city, client?.state].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id)}
                        disabled={deletingId === client.id}
                        className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        {deletingId === client.id ? "Deleting..." : "Delete"}
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
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingClient ? "Edit Client" : "Add Client"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="business_name">
                  Client Name
                </label>
                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="mobile_number">
                    Mobile Number
                  </label>
                  <input
                    id="mobile_number"
                    name="mobile_number"
                    type="text"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="gst_number">
                    GST Number (optional)
                  </label>
                  <input
                    id="gst_number"
                    name="gst_number"
                    type="text"
                    value={formData.gst_number}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="company">
                  Company (optional)
                </label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">No company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.business_name || `Company ${company.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="state">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pincode">
                    Pincode
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="address">
                    Address (optional)
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </div>
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
                  {submitting ? "Saving..." : editingClient ? "Update Client" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
