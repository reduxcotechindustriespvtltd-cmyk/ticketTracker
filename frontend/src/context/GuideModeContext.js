import { createContext, useContext, useState, useCallback } from "react";

const GuideModeContext = createContext(null);
const STORAGE_KEY = "tt_guide_mode";

export function GuideModeProvider({ children }) {
  const [isGuideMode, setIsGuideMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );

  const toggleGuideMode = useCallback(() => {
    setIsGuideMode((prev) => {
      const next = !prev;
      if (next) localStorage.setItem(STORAGE_KEY, "1");
      else localStorage.removeItem(STORAGE_KEY);
      return next;
    });
  }, []);

  return (
    <GuideModeContext.Provider value={{ isGuideMode, toggleGuideMode }}>
      {children}
    </GuideModeContext.Provider>
  );
}

export function useGuideMode() {
  const ctx = useContext(GuideModeContext);
  if (!ctx) throw new Error("useGuideMode must be inside GuideModeProvider");
  return ctx;
}
