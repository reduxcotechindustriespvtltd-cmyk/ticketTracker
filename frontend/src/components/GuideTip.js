import { useState, useRef, useEffect } from "react";
import { useGuideMode } from "../context/GuideModeContext";

/**
 * Inline guide tip marker. Only renders when Guide Mode is on.
 * Shows a pulsing ⓘ badge; hover/click reveals a popover with the tip text.
 *
 * Usage:
 *   <GuideTip tip="This shows the total refundable value..." />
 */
export default function GuideTip({ tip, title, position = "bottom" }) {
  const { isGuideMode } = useGuideMode();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!isGuideMode) return null;

  const posClasses = {
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
  }[position] || "top-full mt-2 left-1/2 -translate-x-1/2";

  return (
    <span ref={ref} className="relative inline-flex items-center ml-1.5 flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4.5 h-4.5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-amber-200 animate-pulse hover:animate-none hover:bg-amber-500 transition-colors focus:outline-none leading-none"
        aria-label="Guide tip"
        style={{ width: "18px", height: "18px", fontSize: "10px" }}
      >
        i
      </button>

      {open && (
        <div
          className={`absolute ${posClasses} z-[300] w-64 bg-slate-900 text-white rounded-xl shadow-2xl p-3.5 pointer-events-none`}
          style={{ minWidth: "220px" }}
        >
          <div className="absolute w-2.5 h-2.5 bg-slate-900 rotate-45"
            style={position === "bottom"
              ? { top: "-5px", left: "50%", transform: "translateX(-50%) rotate(45deg)" }
              : position === "right"
              ? { left: "-5px", top: "50%", transform: "translateY(-50%) rotate(45deg)" }
              : { bottom: "-5px", left: "50%", transform: "translateX(-50%) rotate(45deg)" }
            }
          />
          {title && (
            <p className="text-amber-400 text-[11px] font-bold uppercase tracking-wide mb-1">{title}</p>
          )}
          <p className="text-slate-200 text-xs leading-relaxed">{tip}</p>
        </div>
      )}
    </span>
  );
}

/**
 * A larger guide callout for section-level explanation.
 * Renders as a highlighted card only when guide mode is on.
 */
export function GuideCallout({ children, step, color = "amber" }) {
  const { isGuideMode } = useGuideMode();
  if (!isGuideMode) return null;

  return (
    <div className={`flex gap-3 items-start rounded-xl border px-4 py-3 bg-amber-50 border-amber-200`}>
      {step != null && (
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center mt-0.5">
          {step}
        </span>
      )}
      <p className="text-xs text-amber-800 leading-relaxed">{children}</p>
    </div>
  );
}
