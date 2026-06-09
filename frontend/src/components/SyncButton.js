import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSyncStatus, triggerSync } from "../api/tickets";
import { useDemo } from "../context/DemoContext";
import { SyncIcon, CheckCircleIcon } from "./icons";

export default function SyncButton() {
  const { isDemoMode, demoFetchSyncStatus } = useDemo();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [startDate, setStartDate] = useState("");

  const { data: syncStatus, refetch } = useQuery({
    queryKey: ["syncStatus", isDemoMode],
    queryFn: isDemoMode ? demoFetchSyncStatus : fetchSyncStatus,
    refetchInterval: 30_000,
  });

  async function handleSync() {
    if (isDemoMode) return;
    if (!startDate) {
      setMessage("Select a start date to begin sync");
      setMessageType("error");
      return;
    }
    setSyncing(true);
    setMessage("");
    try {
      const res = await triggerSync({ start_date: startDate });
      setMessage(`Sync queued successfully — task ${res.task_id}`);
      setMessageType("success");
      setTimeout(refetch, 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Sync failed");
      setMessageType("error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <SyncIcon className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Manual Amadeus Sync</h3>
            {syncStatus?.last_sync ? (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                Last sync: {new Date(syncStatus.last_sync).toLocaleString()} —{" "}
                {syncStatus.tickets_fetched} fetched, {syncStatus.tickets_flagged} flagged
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">No sync has been run yet</p>
            )}
          </div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${syncStatus?.last_sync ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
            Sync from date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isDemoMode}
            className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || isDemoMode}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDemoMode ? "Sync (Demo Off)" : syncing ? "Queuing..." : "Sync Now"}
        </button>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
          messageType === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
            : messageType === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-brand-50 border border-brand-200 text-brand-700"
        }`}>
          {message}
        </div>
      )}

      {syncStatus?.errors && (
        <details className="group">
          <summary className="text-xs text-red-500 cursor-pointer font-medium hover:text-red-600">
            View last sync errors
          </summary>
          <pre className="text-xs text-red-400 mt-2 whitespace-pre-wrap bg-red-50 rounded-lg p-3 border border-red-100">
            {syncStatus.errors}
          </pre>
        </details>
      )}
    </div>
  );
}
