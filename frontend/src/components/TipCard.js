import { InfoIcon, CheckCircleIcon, AlertIcon } from "./icons";

const VARIANTS = {
  info: {
    icon: InfoIcon,
    container: "bg-brand-50 border-brand-200",
    iconColor: "text-brand-600",
    titleColor: "text-brand-900",
    textColor: "text-brand-700",
  },
  success: {
    icon: CheckCircleIcon,
    container: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
    textColor: "text-emerald-700",
  },
  warning: {
    icon: AlertIcon,
    container: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    textColor: "text-amber-700",
  },
};

export default function TipCard({ title, children, variant = "info", steps }) {
  const v = VARIANTS[variant];
  const Icon = v.icon;

  return (
    <div className={`rounded-xl border p-5 ${v.container}`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${v.iconColor}`} />
        <div className="flex-1 min-w-0">
          {title && <p className={`font-semibold text-sm ${v.titleColor}`}>{title}</p>}
          {children && <div className={`text-sm mt-1 space-y-1 ${v.textColor}`}>{children}</div>}
          {steps && (
            <ol className={`mt-2 space-y-1.5 text-sm list-none ${v.textColor}`}>
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${v.iconColor} bg-white/60 mt-0.5`}>
                    {i + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
