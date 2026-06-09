import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalOverlay({ onClose, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-md" aria-hidden="true" />
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-elevated animate-modal-in`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
