import { useDemo } from "../context/DemoContext";

export default function DemoModeBanner() {
  const { isDemoMode, exitDemo } = useDemo();
  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="text-base">🎭</span>
        <span>
          <strong>Demo Mode</strong> — all data is simulated. No real Amadeus connection is used.
        </span>
      </div>
      <button
        onClick={exitDemo}
        className="flex-shrink-0 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-900/30 text-amber-900 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
      >
        Exit Demo
      </button>
    </div>
  );
}
