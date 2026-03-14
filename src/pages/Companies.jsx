import { useEffect, useState } from "react";
import { createCompany, deleteCompany, getCompanies } from "../api/companyService";

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      await createCompany(payload);
      setFormData({ name: "", email: "", phone: "" });
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
      <p className="mt-2 text-sm text-slate-600">Create and manage your billing companies.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4"
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
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add Company"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
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
                    <button
                      type="button"
                      onClick={() => handleDelete(company.id)}
                      className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
