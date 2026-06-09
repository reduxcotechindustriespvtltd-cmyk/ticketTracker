import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "../api/tickets";
import { useDemo } from "../context/DemoContext";
import GuideTip from "./GuideTip";

const GUIDE_TIPS = {
  total: "Total number of tickets discovered across all Amadeus sync runs and CSV uploads, regardless of status.",
  no_show: "Coupon status is NS, or the flight departed with the coupon still Open (O) and no cancellation was recorded before departure. On no-shows, only taxes are typically refundable — the base fare is usually forfeited.",
  cancelled: "The PNR was cancelled before the departure date. A cancellation penalty applies, but the remaining fare (Total Fare − Penalty) is refundable. Set penalties per carrier in Refund Rules.",
  recoverable: "Sum of Net Refund amounts across all no-show and cancelled-before-dep tickets. Net Refund = Total Fare − Penalty (or just Tax Amount for no-shows).",
};

function Card({ label, value, sub, borderColor, tip, tipPosition = "bottom", dataTour }) {
  return (
    <div className={`card p-5 border-l-4 ${borderColor}`} data-tour={dataTour}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-500 font-medium leading-tight">{label}</p>
        <GuideTip tip={tip} position={tipPosition} />
      </div>
      <p className="text-3xl font-bold mt-2 text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function KPICards() {
  const { isDemoMode, demoFetchSummary } = useDemo();

  const { data, isLoading } = useQuery({
    queryKey: ["summary", isDemoMode],
    queryFn: isDemoMode ? demoFetchSummary : fetchSummary,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const fmt = (n) =>
    n != null
      ? `₹ ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
      : "—";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="kpi-section">
      <Card
        label="Total Tickets"
        value={data?.total_tickets ?? 0}
        borderColor="border-brand-500"
        tip={GUIDE_TIPS.total}
        tipPosition="bottom"
      />
      <Card
        label="No-Show"
        value={data?.no_show ?? 0}
        borderColor="border-red-500"
        tip={GUIDE_TIPS.no_show}
        tipPosition="bottom"
        dataTour="kpi-no-show"
      />
      <Card
        label="Cancelled Before Dep"
        value={data?.cancelled_before_dep ?? 0}
        borderColor="border-orange-500"
        tip={GUIDE_TIPS.cancelled}
        tipPosition="bottom"
        dataTour="kpi-cancelled"
      />
      <Card
        label="Total Recoverable Value"
        value={fmt(data?.total_recoverable_value)}
        sub={`${data?.recoverable_tickets ?? 0} tickets`}
        borderColor="border-emerald-500"
        tip={GUIDE_TIPS.recoverable}
        tipPosition="left"
        dataTour="kpi-recoverable"
      />
    </div>
  );
}
