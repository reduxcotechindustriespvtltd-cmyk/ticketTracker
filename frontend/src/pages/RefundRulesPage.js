import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRefundRules, updateRefundRule } from "../api/tickets";
import PageHeader from "../components/PageHeader";
import TipCard from "../components/TipCard";

function RuleRow({ rule, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...rule });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(rule.carrier_code, {
        fare_type: form.fare_type,
        refund_window_days: form.refund_window_days ? parseInt(form.refund_window_days) : null,
        noshow_window_days: form.noshow_window_days ? parseInt(form.noshow_window_days) : null,
        penalty_type: form.penalty_type,
        penalty_value: parseFloat(form.penalty_value),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
        <td className="px-5 py-3.5">
          <span className="font-bold text-brand-700 text-sm">{rule.carrier_code}</span>
        </td>
        <td className="px-5 py-3.5 text-sm text-slate-600">{rule.fare_type || "—"}</td>
        <td className="px-5 py-3.5 text-sm text-slate-600">{rule.refund_window_days ?? "—"}</td>
        <td className="px-5 py-3.5 text-sm text-slate-600">{rule.noshow_window_days ?? "—"}</td>
        <td className="px-5 py-3.5 text-sm text-slate-600 capitalize">{rule.penalty_type}</td>
        <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{rule.penalty_value}</td>
        <td className="px-5 py-3.5">
          <button onClick={() => setEditing(true)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            Edit
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-brand-100 bg-brand-50/50">
      <td className="px-5 py-3 font-bold text-brand-700">{rule.carrier_code}</td>
      {["fare_type", "refund_window_days", "noshow_window_days"].map((k) => (
        <td key={k} className="px-5 py-2">
          <input
            value={form[k] ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
            className="input-field py-1.5"
          />
        </td>
      ))}
      <td className="px-5 py-2">
        <select
          value={form.penalty_type}
          onChange={(e) => setForm((f) => ({ ...f, penalty_type: e.target.value }))}
          className="input-field py-1.5"
        >
          <option value="flat">Flat</option>
          <option value="percentage">Percentage</option>
        </select>
      </td>
      <td className="px-5 py-2">
        <input
          value={form.penalty_value}
          onChange={(e) => setForm((f) => ({ ...f, penalty_value: e.target.value }))}
          type="number"
          className="input-field py-1.5 w-24"
        />
      </td>
      <td className="px-5 py-2 space-x-2">
        <button onClick={save} disabled={saving} className="text-xs btn-primary px-3 py-1.5">
          {saving ? "..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs btn-ghost">Cancel</button>
      </td>
    </tr>
  );
}

export default function RefundRulesPage() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery({ queryKey: ["refundRules"], queryFn: fetchRefundRules });
  const [newCarrier, setNewCarrier] = useState("");

  async function handleSave(carrier, body) {
    await updateRefundRule(carrier, body);
    queryClient.invalidateQueries({ queryKey: ["refundRules"] });
  }

  async function addCarrier() {
    if (!newCarrier || newCarrier.length !== 2) return;
    await updateRefundRule(newCarrier.toUpperCase(), {
      penalty_type: "flat", penalty_value: 0,
    });
    queryClient.invalidateQueries({ queryKey: ["refundRules"] });
    setNewCarrier("");
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHeader
        title="Refund Rules"
        subtitle="Configure per-carrier cancellation penalties for net refund calculations"
      />

      <TipCard variant="info" title="How penalties work">
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Flat</strong> — fixed amount deducted from gross fare (e.g. ₹3,000)</li>
          <li><strong>Percentage</strong> — percentage of base fare (e.g. 25% of ₹12,000 = ₹3,000)</li>
          <li>Refund and no-show windows determine which penalty tier applies</li>
          <li>Net refund = Total fare − Cancellation penalty (shown in ticket dashboard)</li>
        </ul>
      </TipCard>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Carrier", "Fare Type", "Refund Window", "No-Show Window", "Penalty Type", "Penalty Value", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Loading rules...</td></tr>
            )}
            {!isLoading && rules.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No rules configured. Add a carrier below.</td></tr>
            )}
            {rules.map((r) => <RuleRow key={r.id} rule={r} onSave={handleSave} />)}
          </tbody>
        </table>
      </div>

      <div className="card p-5 flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Add carrier</label>
          <input
            value={newCarrier}
            onChange={(e) => setNewCarrier(e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="e.g. 6E, AI"
            className="input-field"
          />
        </div>
        <button onClick={addCarrier} className="btn-primary">
          Add Carrier
        </button>
      </div>
    </div>
  );
}
