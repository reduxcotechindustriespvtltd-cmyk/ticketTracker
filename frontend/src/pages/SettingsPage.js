import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchAmadeusConfig, saveAmadeusConfig } from "../api/tickets";
import { useAmadeusConfig } from "../hooks/useAmadeusConfig";
import PageHeader from "../components/PageHeader";
import TipCard from "../components/TipCard";
import { ShieldIcon, CheckCircleIcon } from "../components/icons";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { isConfigured, officeId: currentOffice, lastSyncedAt } = useAmadeusConfig();
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState({
    office_id: "",
    wsap_endpoint: "",
    wsap_user: "",
    wsap_pass: "",
    totp_secret: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAmadeusConfig()
      .then((cfg) => {
        setIsNew(false);
        setForm((f) => ({
          ...f,
          office_id: cfg.office_id || "",
          wsap_endpoint: cfg.wsap_endpoint || "",
        }));
      })
      .catch(() => setIsNew(true));
  }, []);

  function update(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  function validate() {
    if (!form.office_id.trim()) return "Office ID is required";
    if (!form.wsap_endpoint.trim()) return "WSAP Endpoint is required";
    if (!form.wsap_endpoint.startsWith("https://")) return "WSAP Endpoint must start with https://";
    if (isNew && !form.wsap_user.trim()) return "WSAP Username is required";
    if (isNew && !form.wsap_pass.trim()) return "WSAP Password is required";
    if (!isNew && (form.wsap_user || form.wsap_pass)) {
      if (!form.wsap_user.trim() || !form.wsap_pass.trim()) {
        return "Both username and password are required when updating credentials";
      }
    }
    return null;
  }

  async function handleSave(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");
    setSaved(false);
    try {
      await saveAmadeusConfig({
        office_id: form.office_id.trim(),
        wsap_endpoint: form.wsap_endpoint.trim(),
        wsap_user: form.wsap_user.trim(),
        wsap_pass: form.wsap_pass.trim(),
        totp_secret: form.totp_secret.trim() || null,
      });
      setSaved(true);
      setIsNew(false);
      setForm((f) => ({ ...f, wsap_user: "", wsap_pass: "" }));
      await queryClient.invalidateQueries({ queryKey: ["amadeusConfigStatus"] });
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <PageHeader
        title="GDS Settings"
        subtitle="Manage your Amadeus credentials — required for all sync and upload operations"
        badge={
          isConfigured ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Not configured
            </span>
          )
        }
      />

      {isConfigured && currentOffice && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Active office</p>
            <p className="text-sm font-semibold text-slate-800">{currentOffice}</p>
          </div>
          {lastSyncedAt && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Last synced</p>
              <p className="text-sm text-slate-700">{new Date(lastSyncedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Office ID <span className="text-red-500">*</span>
          </label>
          <input
            name="office_id"
            value={form.office_id}
            onChange={update}
            required
            placeholder="BOMXX1234"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            WSAP Endpoint <span className="text-red-500">*</span>
          </label>
          <input
            name="wsap_endpoint"
            value={form.wsap_endpoint}
            onChange={update}
            required
            placeholder="https://nodeD1.test.webservices.amadeus.com/1ASIWSIXE9"
            className="input-field"
          />
          <p className="text-xs text-slate-400 mt-1">Must start with https://</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            WSAP Username {!isNew ? "" : <span className="text-red-500">*</span>}
          </label>
          <input
            name="wsap_user"
            value={form.wsap_user}
            onChange={update}
            required={isNew}
            placeholder={isNew ? "Your WSAP username" : "Re-enter to update"}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            WSAP Password {!isNew ? "" : <span className="text-red-500">*</span>}
          </label>
          <input
            name="wsap_pass"
            type="password"
            value={form.wsap_pass}
            onChange={update}
            required={isNew}
            placeholder={isNew ? "Your WSAP password" : "Re-enter to update"}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">TOTP Secret (optional)</label>
          <input
            name="totp_secret"
            value={form.totp_secret}
            onChange={update}
            placeholder="Base32 OTP secret for 2FA portals"
            className="input-field"
          />
        </div>

        <TipCard variant="success" title="Security">
          <p className="flex items-center gap-1.5">
            <ShieldIcon className="w-4 h-4" />
            Credentials are AES-256-GCM encrypted at rest. Secrets are masked in API responses.
          </p>
        </TipCard>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            Configuration saved successfully
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-60">
          {loading ? "Saving..." : isNew ? "Save Credentials" : "Update Credentials"}
        </button>
      </form>
    </div>
  );
}
