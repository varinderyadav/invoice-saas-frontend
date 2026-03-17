import { useEffect, useState } from "react";
import { createCompany, deleteCompany, getCompanies, updateCompany } from "../api/companyService";
import ConfirmDialog from "../components/ConfirmDialog";

function normalizeList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCompanies();
      setCompanies(normalizeList(response));
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      business_name: formData.name,
      owner_name: formData.name,
      email: formData.email,
      mobile_number: formData.phone,
      state: "N/A",
      city: "N/A",
      pincode: "000000",
      address: "",
    };

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, payload);
      } else {
        await createCompany(payload);
      }
      setFormData({ name: "", email: "", phone: "" });
      setEditingCompany(null);
      await loadCompanies();
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.mobile_number?.[0] ||
        "Failed to create company.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCompany(id);
      setCompanies((prev) => prev.filter((company) => company.id !== id));
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete company.");
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.business_name || "",
      email: company.email || "",
      phone: company.mobile_number || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingCompany(null);
    setFormData({ name: "", email: "", phone: "" });
  };

  const openDeleteDialog = (id) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const closeDeleteDialog = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await handleDelete(pendingDeleteId);
    closeDeleteDialog();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
      <p className="mt-2 text-sm text-slate-600">Create and manage your billing companies.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm md:grid-cols-4"
      >
        <input
          name="name"
          type="text"
          placeholder="Company name"
          value={formData.name}
          onChange={handleChange}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          required
        />
        <input
          name="phone"
          type="text"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary disabled:opacity-60"
        >
          {submitting ? "Saving..." : editingCompany ? "Update Company" : "Add Company"}
        </button>
        {editingCompany ? (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="btn btn-outline"
          >
            Cancel
          </button>
        ) : null}
      </form>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-6 table-wrap">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                  Loading companies...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                  No companies found.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-4 py-3 text-sm text-slate-800">{company.business_name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{company.email || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{company.mobile_number || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(company)}
                        className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                      onClick={() => openDeleteDialog(company.id)}
                      className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete company?"
        message={
          "Are you sure you want to delete this data?\n\nAfter deleting this company, its invoices and clients will also be deleted."
        }
        confirmLabel="Delete"
        confirmTone="danger"
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}
