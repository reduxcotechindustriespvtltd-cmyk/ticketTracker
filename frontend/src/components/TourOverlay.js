import { useEffect, useState, useRef } from "react";
import { useTour } from "../context/TourContext";
import TOUR_STEPS from "../data/tourSteps";

const PADDING = 10;
const TOOLTIP_W = 348;
const OFFSET = 18;

function calcTooltipStyle(rect) {
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const w = Math.min(TOOLTIP_W, viewW - 32);

  if (!rect) {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: w,
      zIndex: 10002,
    };
  }

  let left = rect.left + rect.width / 2 - w / 2;
  left = Math.max(16, Math.min(left, viewW - w - 16));

  const spaceBelow = viewH - rect.bottom - PADDING - OFFSET;
  if (spaceBelow >= 160) {
    return { position: "fixed", top: rect.bottom + PADDING + OFFSET, left, width: w, zIndex: 10002 };
  }

  const spaceAbove = rect.top - PADDING - OFFSET;
  if (spaceAbove >= 160) {
    return { position: "fixed", bottom: viewH - rect.top + PADDING + OFFSET, left, width: w, zIndex: 10002 };
  }

  // Fallback: float over center of element
  return {
    position: "fixed",
    top: Math.max(16, rect.top + rect.height / 2 - 100),
    left,
    width: w,
    zIndex: 10002,
  };
}

export default function TourOverlay() {
  const { isActive, currentStep, totalSteps, nextStep, prevStep, endTour } = useTour();
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  // Measure target element, scroll into view, then reveal spotlight
  useEffect(() => {
    if (!isActive) {
      setRect(null);
      setVisible(false);
      return;
    }

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    clearTimeout(timerRef.current);

    if (!step.target) {
      setRect(null);
      setVisible(true);
      return;
    }

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      nextStep();
      return;
    }

    setVisible(false);
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    timerRef.current = setTimeout(() => {
      setRect(el.getBoundingClientRect());
      setVisible(true);
    }, 380);

    return () => clearTimeout(timerRef.current);
  }, [isActive, currentStep, nextStep]);

  // Re-measure on window resize
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (!step?.target) return;

    function onResize() {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isActive, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    function onKey(e) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); nextStep(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prevStep(); }
      else if (e.key === "Escape") endTour();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, nextStep, prevStep, endTour]);

  if (!isActive || !visible) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isContent = !isFirst && !isLast;
  const contentStep = currentStep;
  const totalContent = totalSteps - 2;
  const progress = isContent ? (contentStep / totalContent) * 100 : 0;
  const tipStyle = calcTooltipStyle(rect);

  return (
    <>
      {/* Full-screen backdrop for no-target steps */}
      {!step.target && (
        <div
          className="fixed inset-0 bg-black/70 z-[10000]"
          style={{ backdropFilter: "blur(2px)" }}
        />
      )}

      {/* Spotlight: transparent div with massive box-shadow creating the dark vignette */}
      {step.target && rect && (
        <div
          className="tour-spotlight"
          style={{
            position: "fixed",
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            borderRadius: 14,
            zIndex: 10000,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tooltip card */}
      <div className="tour-card" style={tipStyle}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isContent ? `Step ${contentStep} of ${totalContent}` : isFirst ? "Welcome" : "Done!"}
          </span>
          <button
            onClick={endTour}
            className="text-slate-400 hover:text-slate-600 transition-colors text-base leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100"
            aria-label="Close tour"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        {isContent && (
          <div className="w-full bg-slate-100 rounded-full h-1 mb-4 overflow-hidden">
            <div
              className="bg-brand-500 h-1 rounded-full"
              style={{ width: `${progress}%`, transition: "width 0.4s ease" }}
            />
          </div>
        )}

        {/* Content */}
        <div className="mb-5">
          {step.emoji && (
            <div className="text-4xl text-center mb-3 select-none">{step.emoji}</div>
          )}
          <h3 className="text-[15px] font-bold text-slate-900 mb-2 leading-snug">{step.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{step.content}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={prevStep}
              className="btn-secondary py-2 px-4 text-sm flex-shrink-0"
            >
              ← Back
            </button>
          )}
          <button
            onClick={nextStep}
            className="btn-primary py-2.5 px-5 text-sm flex-1"
          >
            {isLast ? "✓ Finish" : isFirst ? "Start Tour →" : "Next →"}
          </button>
        </div>

        {isContent && (
          <p className="text-[10px] text-slate-400 text-center mt-2.5">
            ← → arrow keys · Esc to skip
          </p>
        )}
      </div>
    </>
  );
}
