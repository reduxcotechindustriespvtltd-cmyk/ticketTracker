import SyncButton from "../components/SyncButton";
import PageHeader from "../components/PageHeader";
import TipCard from "../components/TipCard";
import { GuideCallout } from "../components/GuideTip";
import { useDemo } from "../context/DemoContext";

const SYNC_TIPS = [
  "TJQ command is used for tickets issued within the last 62 days",
  "RTD command retrieves archived data for tickets older than 12 months",
  "Each ticket runs the pipeline: TWD → RH → FQD + FQN*PE for full fare detail",
  "Airport-control tickets (status A) are automatically re-checked after 48 hours via Celery beat",
];

const COMMAND_REF = [
  { cmd: "TJQ/SOF/D-{date}", desc: "Ticket journal query — discover all tickets issued on a given date (max 62 days back)" },
  { cmd: "RTD/D-{date}", desc: "Retrieve ticket data — archived records for dates older than 62 days" },
  { cmd: "TWD/TKT{number}", desc: "Ticket watch display — coupon status, fare, route, and passenger per ticket" },
  { cmd: "RT {pnr} + RH", desc: "Retrieve PNR and history — extracts the exact cancellation timestamp" },
  { cmd: "FQD + FQN{n}*PE", desc: "Fare quote display + penalty category — determines penalty type and amount" },
];

export default function SyncPage() {
  const { isDemoMode } = useDemo();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <PageHeader
        title="Amadeus Sync"
        subtitle="Trigger manual GDS data discovery and ticket enrichment"
      />

      <GuideCallout step={1}>
        <strong>How sync works:</strong> Pick a start date and click "Sync Now". The system queries
        Amadeus using <code className="bg-amber-100 px-1 rounded">TJQ</code> (recent) or{" "}
        <code className="bg-amber-100 px-1 rounded">RTD</code> (archived) to discover ticket numbers,
        then runs a <em>3-command pipeline</em> per ticket to get full coupon status, PNR history, and
        fare rules. Results appear in the Ticket Dashboard.
      </GuideCallout>

      {isDemoMode ? (
        <div className="card p-6 border-amber-200 bg-amber-50/50">
          <p className="font-semibold text-amber-800 text-sm">Demo Mode — Sync Disabled</p>
          <p className="text-amber-700 text-sm mt-1">
            The 14 sample tickets are already loaded. Disable Demo Mode from the sidebar to trigger
            a real Amadeus sync with your GDS credentials.
          </p>
        </div>
      ) : (
        <SyncButton />
      )}

      <TipCard variant="info" title="Sync pipeline" steps={SYNC_TIPS} />

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Amadeus Command Reference</h3>
          <GuideCallout>
            These are the exact Amadeus cryptic commands the system sends. You can paste them manually
            in your Amadeus terminal to verify results.
          </GuideCallout>
        </div>
        <div className="divide-y divide-slate-100">
          {COMMAND_REF.map(({ cmd, desc }) => (
            <div key={cmd} className="flex items-start gap-4 px-5 py-3">
              <code className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md min-w-[180px] flex-shrink-0">
                {cmd}
              </code>
              <p className="text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
