export default function ExpiryCountdown({ days }) {
  if (days === null || days === undefined) return <span className="text-gray-400 text-xs">—</span>;

  let color, label;
  if (days < 0) {
    color = "text-gray-400";
    label = `${Math.abs(days)}d ago`;
  } else if (days < 7) {
    color = "text-red-600 font-bold";
    label = `${days}d`;
  } else if (days <= 30) {
    color = "text-amber-600 font-medium";
    label = `${days}d`;
  } else {
    color = "text-green-600";
    label = `${days}d`;
  }

  return <span className={`text-xs ${color}`}>{label}</span>;
}
