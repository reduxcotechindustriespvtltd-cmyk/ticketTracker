import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { saveAmadeusConfig } from "../api/tickets";
import { LogoIcon, ShieldIcon, CheckCircleIcon } from "./icons";
import TipCard from "./TipCard";

const STEPS = [
  { id: 1, label: "Office ID" },
  { id: 2, label: "Credentials" },
  { id: 3, label: "Confirm" },
];

// Amadeus office IDs: 3-letter city + 2 alphanumeric + 4 alphanumeric (e.g. BOMXX1234)
const OFFICE_ID_REGEX = /^[A-Z]{3}[A-Z0-9]{2}[A-Z0-9]{4}$/;

export default function SetupWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    office_id: "", wsap_endpoint: "", wsap_user: "", wsap_pass: "", totp_secret: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "office_id" ? value.toUpperCase() : value }));
  }

  const officeIdValid = OFFICE_ID_REGEX.test(form.office_id.trim());
  const endpointValid = form.wsap_endpoint.trim().startsWith("https://");

  function canProceed() {
    if (step === 1) return officeIdValid && endpointValid;
    if (step === 2) return form.wsap_user.trim() && form.wsap_pass.trim();
    return true;
  }

  async function handleComplete() {
    setLoading(true);
    setError("");
    try {
      await saveAmadeusConfig({
        office_id: form.office_id.trim(),
        wsap_endpoint: form.wsap_endpoint.trim(),
        wsap_user: form.wsap_user.trim(),
        wsap_pass: form.wsap_pass.trim(),
        totp_secret: form.totp_secret.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["amadeusConfigStatus"] });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <LogoIcon className="w-10 h-10" />
            <span className="text-2xl font-bold text-white tracking-tight">TicketTrack</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Connect your Amadeus GDS</h1>
          <p className="text-slate-400 text-sm mt-1">Credentials are required before you can sync or audit tickets</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > s.id ? "bg-emerald-500 text-white" : step === s.id ? "bg-white text-brand-700" : "bg-white/10 text-slate-400"
              }`}>
                {step > s.id ? <CheckCircleIcon className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? "text-white" : "text-slate-500"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${step > s.id ? "bg-emerald-500" : "bg-white/20"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Office ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="office_id"
                  value={form.office_id}
                  onChange={update}
                  placeholder="e.g. BOMXX1234"
                  className={`input-field ${form.office_id && !officeIdValid ? "border-red-400 focus:ring-red-300" : ""}`}
                  autoFocus
                  maxLength={9}
                />
                {form.office_id && !officeIdValid ? (
                  <p className="text-xs text-red-500 mt-1.5">
                    Must be 9 characters: 3-letter city + 2 + 4 alphanumeric (e.g. BOMXX1234)
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5">Your Amadeus office identifier from the GDS profile</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  WSAP Endpoint URL <span className="text-red-500">*</span>
                </label>
                <input
                  name="wsap_endpoint"
                  value={form.wsap_endpoint}
                  onChange={update}
                  placeholder="https://production.webservices.amadeus.com/1ASIWSAS1ASI"
                  className={`input-field ${form.wsap_endpoint && !endpointValid ? "border-red-400 focus:ring-red-300" : ""}`}
                />
                {form.wsap_endpoint && !endpointValid ? (
                  <p className="text-xs text-red-500 mt-1.5">Must start with https://</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5">
                    Provided by Amadeus with your GDS contract — check your WSAP setup email
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  WSAP Username <span className="text-red-500">*</span>
                </label>
                <input name="wsap_user" value={form.wsap_user} onChange={update} className="input-field" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  WSAP Password <span className="text-red-500">*</span>
                </label>
                <input name="wsap_pass" type="password" value={form.wsap_pass} onChange={update} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">TOTP Secret (optional)</label>
                <input name="totp_secret" value={form.totp_secret} onChange={update} placeholder="Base32 OTP secret" className="input-field" />
              </div>
              <TipCard variant="success" title="Encrypted at rest">
                <p className="flex items-center gap-1.5">
                  <ShieldIcon className="w-4 h-4" />
                  All credentials are AES-256-GCM encrypted before storage. Passwords are never stored in plain text.
                </p>
              </TipCard>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Review your configuration</h3>
              <dl className="space-y-3 text-sm">
                {[
                  ["Office ID", form.office_id],
                  ["WSAP Endpoint", form.wsap_endpoint || "—"],
                  ["WSAP User", form.wsap_user],
                  ["Password", "••••••••"],
                  ["TOTP", form.totp_secret ? "Configured" : "Not set"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-40"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button type="button" onClick={handleComplete} disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
