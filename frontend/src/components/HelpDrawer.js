import { useState, useEffect, useRef, useCallback } from "react";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-brand-500" : "bg-slate-200"
      }`}
      aria-label={label}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function HelpDrawer({
  isOpen,
  onClose,
  isGuideMode,
  onGuideToggle,
  isDemoMode,
  onDemoToggle,
  onStartTour,
}) {
  const [dragY, setDragY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragging = useRef(false);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);

  // Mount with a tiny delay so the slide-up animation is visible
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
      setDragY(0);
      dragYRef.current = 0;
    }
  }, [isOpen]);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragY(0);
      dragYRef.current = 0;
      onClose();
    }, 290);
  }, [onClose]);

  function startDrag(e) {
    e.preventDefault();
    dragging.current = true;
    startYRef.current = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.clientY;
  }

  useEffect(() => {
    if (!isOpen) return;

    function onMove(e) {
      if (!dragging.current) return;
      const y = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;
      const delta = Math.max(0, y - startYRef.current);
      dragYRef.current = delta;
      setDragY(delta);
    }

    function onEnd() {
      if (!dragging.current) return;
      dragging.current = false;
      if (dragYRef.current > 90) {
        close();
      } else {
        dragYRef.current = 0;
        setDragY(0);
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const isOut = isClosing || !mounted;
  const translate = isOut ? "100%" : `${dragY}px`;
  const sheetTransition = dragging.current
    ? "none"
    : "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)";
  const backdropOpacity = isOut
    ? 0
    : Math.max(0, 1 - dragY / 300);

  return (
    <div className="fixed inset-0 z-[900]" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{
          opacity: backdropOpacity,
          backdropFilter: "blur(2px)",
          transition: dragging.current ? "none" : "opacity 0.32s ease",
        }}
        onClick={close}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] shadow-2xl will-change-transform"
        style={{
          transform: `translateY(${translate})`,
          transition: sheetTransition,
        }}
      >
        {/* Drag handle area */}
        <div
          className="flex justify-center pt-3.5 pb-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div className="w-9 h-[5px] bg-slate-200 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-5 pt-2 pb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Help &amp; Guidance
            </h2>
            <button
              onClick={close}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors text-base"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Product Tour */}
            <button
              onClick={() => {
                close();
                setTimeout(onStartTour, 320);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-brand-50 border border-brand-100 active:bg-brand-100 transition-colors group text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[22px] leading-none">🎯</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-snug">
                  Product Tour
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Step-by-step spotlight through every feature
                </p>
              </div>
              <span className="text-brand-400 group-hover:text-brand-600 transition-colors text-lg font-light">
                →
              </span>
            </button>

            {/* Guide Mode */}
            <div
              data-tour="nav-guide"
              className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[22px] leading-none">🧭</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-snug">
                  Guide Mode
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Inline ⓘ tips on every section
                </p>
              </div>
              <Toggle
                checked={isGuideMode}
                onChange={onGuideToggle}
                label="Toggle Guide Mode"
              />
            </div>

            {/* Demo Mode */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[22px] leading-none">🎭</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-snug">
                  Demo Mode
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Explore with 14 realistic sample tickets
                </p>
              </div>
              <Toggle
                checked={isDemoMode}
                onChange={onDemoToggle}
                label="Toggle Demo Mode"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
