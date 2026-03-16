import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData);

    setLoading(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setError(result.message || "Login failed. Please check your credentials.");
  };

  return (
    <div className="mx-auto mt-12 max-w-md app-card p-6">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="Invoice SaaS" className="h-10 w-10" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to continue.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="username"
            name="username"
            type="email"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-slate-400 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-slate-400 focus:outline-none"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="mt-2 flex flex-col items-center gap-3 text-sm text-slate-600">
          <p>Don&apos;t have an account?</p>
          <Link
            to="/register"
            className="btn btn-outline w-full"
          >
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}
