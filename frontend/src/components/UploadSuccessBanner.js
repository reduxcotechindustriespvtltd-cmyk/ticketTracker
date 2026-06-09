import { CheckCircleIcon } from "./icons";

export default function UploadSuccessBanner({ result, onDismiss }) {
  const tickets = result.queued_ticket_numbers || [];

  return (
    <div className="card border-emerald-200 bg-emerald-50/80 overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-emerald-900 text-sm">Upload complete</p>
            <p className="text-emerald-700 text-sm mt-0.5">
              <strong>{result.queued}</strong> ticket{result.queued !== 1 ? "s" : ""} queued
              {result.skipped > 0 && <> · <strong>{result.skipped}</strong> skipped</>}
              {result.demo_mode
                ? " — demo data loaded into the table below."
                : " — processing via Amadeus GDS. The table below refreshes automatically."}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-emerald-600 hover:text-emerald-800 text-xs font-medium flex-shrink-0"
        >
          Dismiss
        </button>
      </div>

      {tickets.length > 0 && (
        <div className="px-5 pb-4 border-t border-emerald-200/60 pt-3">
          <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide mb-2">
            Queued tickets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tickets.map((num) => (
              <code
                key={num}
                className="text-[11px] font-mono bg-white/70 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded"
              >
                {num}
              </code>
            ))}
            {result.queued > tickets.length && (
              <span className="text-xs text-emerald-600 self-center">
                +{result.queued - tickets.length} more
              </span>
            )}
          </div>
        </div>
      )}

      {result.skipped_details?.length > 0 && (
        <div className="px-5 pb-4 border-t border-emerald-200/60 pt-3">
          <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-2">
            Skipped rows
          </p>
          <ul className="space-y-0.5">
            {result.skipped_details.map((s, i) => (
              <li key={i} className="text-xs text-red-600">
                {s.ticket_number || "(empty)"}: {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
