const TAG_CONFIG = {
  active:               { label: "Active",               bg: "bg-emerald-50",  text: "text-emerald-700", ring: "ring-emerald-200" },
  no_show:              { label: "No-Show",              bg: "bg-red-50",      text: "text-red-700",     ring: "ring-red-200" },
  cancelled_before_dep: { label: "Cancelled Before Dep", bg: "bg-orange-50", text: "text-orange-700",  ring: "ring-orange-200" },
  used:                 { label: "Used",                 bg: "bg-slate-100",   text: "text-slate-600",   ring: "ring-slate-200" },
  refunded:             { label: "Refunded",             bg: "bg-violet-50",   text: "text-violet-700",  ring: "ring-violet-200" },
  retry_48hrs:          { label: "Retry 48h",            bg: "bg-amber-50",    text: "text-amber-700",   ring: "ring-amber-200" },
  manual_check:         { label: "Manual Check",         bg: "bg-slate-100",   text: "text-slate-600",   ring: "ring-slate-200" },
};

const PROCESSING = {
  label: "Processing",
  bg: "bg-brand-50",
  text: "text-brand-700",
  ring: "ring-brand-200",
};

export default function StatusBadge({ tag, syncStatus }) {
  const cfg = syncStatus === "processing"
    ? PROCESSING
    : TAG_CONFIG[tag] || { label: tag, bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      {cfg.label}
    </span>
  );
}
