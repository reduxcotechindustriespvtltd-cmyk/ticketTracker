import { useQuery } from "@tanstack/react-query";
import { fetchAuditTrail } from "../api/tickets";
import { useDemo } from "../context/DemoContext";
import StatusBadge from "./StatusBadge";
import ExpiryCountdown from "./ExpiryCountdown";
import ModalOverlay from "./ModalOverlay";
import GuideTip from "./GuideTip";

function Row({ label, value, tip }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium w-40 flex-shrink-0 flex items-center gap-1">
        {label}
        {tip && <GuideTip tip={tip} position="right" />}
      </span>
      <span className="text-xs text-slate-800 text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

const COUPON_STATUS_LABELS = {
  O: "O — Open (unutilised)",
  NS: "NS — No-Show",
  F: "F — Flown (used)",
  V: "V — Void",
  R: "R — Refunded",
  E: "E — Exchanged",
  A: "A — Airport Control (recheck in 48h)",
};

export default function TicketDetailModal({ ticket, onClose }) {
  const { isDemoMode, demoFetchAuditTrail } = useDemo();

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit", ticket.id, isDemoMode],
    queryFn: () => isDemoMode ? demoFetchAuditTrail(ticket.id) : fetchAuditTrail(ticket.id),
  });

  const fmt = (n) =>
    n != null ? `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

  const refundFormula =
    ticket.tag === "no_show"
      ? "Tax Amount only (base fare forfeited on no-show)"
      : ticket.tag === "cancelled_before_dep"
      ? "Total Fare − Penalty (penalty from Refund Rules per carrier)"
      : "N/A";

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-2xl">
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-slate-900 text-lg font-mono">{ticket.ticket_number}</h2>
            <p className="text-sm text-slate-500">{ticket.passenger_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge tag={ticket.tag} syncStatus={ticket.sync_status} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 text-xl transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Flight details */}
          <section>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Flight Details
            </h3>
            <div className="card p-4">
              <Row label="Route" value={ticket.route} />
              <Row label="Carrier" value={ticket.carrier_code} />
              <Row label="PNR Locator" value={ticket.pnr_locator}
                tip="6-character Amadeus PNR. Used to retrieve booking history (RH command) and check cancellation timestamp." />
              <Row label="Departure" value={ticket.departure_date} />
              <Row label="Issue Date" value={ticket.issue_date} />
              <Row
                label="Coupon Status"
                value={COUPON_STATUS_LABELS[ticket.coupon_status] || ticket.coupon_status}
                tip="GDS coupon status code. O=Open, NS=No-Show, F=Flown, V=Void, R=Refunded, A=Airport Control. The tag (No-Show / Cancelled) is derived from this + departure date + PNR history." />
              <Row label="PNR Cancelled At" value={ticket.pnr_cancelled_at
                ? new Date(ticket.pnr_cancelled_at).toLocaleString()
                : ticket.tag === "no_show" ? "Not cancelled" : "—"} />
              <Row label="Days Until Expiry" value={<ExpiryCountdown days={ticket.days_until_expiry} />} />
            </div>
          </section>

          {/* Fare breakdown */}
          <section>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Fare Breakdown
            </h3>
            <div className="card p-4">
              <Row label="Fare Basis" value={ticket.fare_basis_code}
                tip="Fare family code from GDS (e.g. SSAVER, YFLEX). Determines which penalty category applies in FQN*PE." />
              <Row label="Base Fare" value={fmt(ticket.base_fare)}
                tip="The airline fare excluding taxes and surcharges. For no-shows, this portion is typically forfeited." />
              <Row label="Tax" value={fmt(ticket.tax_amount)}
                tip="Airport taxes, fuel surcharge, GST. Refundable even on no-shows in most cases." />
              <Row label="Total Fare" value={fmt(ticket.total_fare)} />
              <Row label="Penalty Applied" value={fmt(ticket.cancellation_penalty)}
                tip="Loaded from Refund Rules (per carrier). Can be a flat amount or % of base fare. For no-shows, penalty = entire base fare." />
              <Row
                label="Net Refund"
                value={<strong className="text-emerald-700 text-sm">{fmt(ticket.net_refund_amount)}</strong>}
                tip={`Formula: ${refundFormula}`}
              />
            </div>

            {/* Formula callout */}
            {["no_show", "cancelled_before_dep"].includes(ticket.tag) && (
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Refund formula: </span>
                {refundFormula}
              </div>
            )}
          </section>

          {/* Amadeus audit trail */}
          <section>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              Amadeus Audit Trail
              <GuideTip
                tip="Every GDS command executed for this ticket is logged here. TWD fetches ticket status, RH retrieves PNR history (cancellation timestamps), FQD+FQN*PE fetches fare rules and penalty categories."
                position="right"
              />
            </h3>
            {isLoading && <p className="text-sm text-slate-400">Loading audit records...</p>}
            {auditLogs.map((log) => (
              <div key={log.id} className="mb-3 card overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 flex justify-between items-center border-b border-slate-100">
                  <code className="text-xs font-mono font-semibold text-brand-700">{log.command_used}</code>
                  <span className="text-[11px] text-slate-400">{new Date(log.parsed_at).toLocaleString()}</span>
                </div>
                <pre className="px-4 py-3 text-xs font-mono overflow-x-auto bg-slate-900 text-emerald-300 max-h-40 leading-relaxed">
                  {log.raw_response || "(empty response)"}
                </pre>
              </div>
            ))}
            {!isLoading && auditLogs.length === 0 && (
              <p className="text-sm text-slate-400 italic">
                {isDemoMode
                  ? "In demo mode, only ticket #1 has a sample audit trail. Click SHARMA/RAJESH to see it."
                  : "No audit records yet — run a sync to populate."}
              </p>
            )}
          </section>
        </div>
      </div>
    </ModalOverlay>
  );
}
