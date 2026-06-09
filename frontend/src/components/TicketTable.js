import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import ExpiryCountdown from "./ExpiryCountdown";
import TicketDetailModal from "./TicketDetailModal";
import EmptyState from "./EmptyState";
import GuideTip from "./GuideTip";
import { TicketIcon } from "./icons";

const COLS = [
  { key: "ticket_number",        label: "Ticket #" },
  { key: "passenger_name",       label: "Passenger" },
  { key: "route",                label: "Route" },
  { key: "issue_date",           label: "Issue Date" },
  { key: "departure_date",       label: "Departure" },
  { key: "carrier_code",         label: "Carrier" },
  { key: "tag",                  label: "Status",     tip: "Categorised by coupon status + departure date + PNR cancellation timestamp. No-Show = missed flight. Cancelled Before Dep = PNR cancelled before departure. Active = future flight." },
  { key: "total_fare",           label: "Gross Fare" },
  { key: "cancellation_penalty", label: "Penalty",    tip: "No-Show: base fare is forfeited (only taxes refundable). Cancelled Before Dep: flat or % penalty from Refund Rules." },
  { key: "net_refund_amount",    label: "Net Refund", tip: "For Cancelled Before Dep: Total Fare − Penalty. For No-Show: Tax Amount only. This is what you can actually claim back from the airline.", tourId: "col-net-refund" },
  { key: "days_until_expiry",    label: "Expiry",     tip: "Days from today to the departure date. Red (<7d) means the refund filing window is closing. Most airlines require claims within 90–365 days of issue.", tourId: "col-expiry" },
];

function fmt(n, currency) {
  if (n == null) return "—";
  return `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function TicketTable({ tickets, isLoading, total, page, pageSize, onPageChange }) {
  const [selected, setSelected] = useState(null);
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="card divide-y divide-slate-100">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-slate-50" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden" data-tour="ticket-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    data-tour={c.tourId}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {c.label}
                      {c.tip && <GuideTip tip={c.tip} position="bottom" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={COLS.length}>
                    <EmptyState
                      icon={TicketIcon}
                      title="No tickets yet"
                      description="Run a sync from the Sync page or upload a CSV to start auditing tickets."
                      action={<Link to="/sync" className="btn-primary">Go to Sync</Link>}
                    />
                  </td>
                </tr>
              )}
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-brand-50/40 cursor-pointer transition-colors"
                  onClick={() => setSelected(t)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-brand-700 font-medium">{t.ticket_number}</td>
                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{t.passenger_name || "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{t.route || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.issue_date || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.departure_date || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{t.carrier_code || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge tag={t.tag} syncStatus={t.sync_status} /></td>
                  <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{fmt(t.total_fare, t.currency)}</td>
                  <td className="px-4 py-3 text-right text-red-600 tabular-nums">{fmt(t.cancellation_penalty, t.currency)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">{fmt(t.net_refund_amount, t.currency)}</td>
                  <td className="px-4 py-3 text-center"><ExpiryCountdown days={t.days_until_expiry} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs text-slate-500 font-medium">{total.toLocaleString()} tickets</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600 font-medium px-2">
                {page} / {totalPages || 1}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <TicketDetailModal ticket={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
