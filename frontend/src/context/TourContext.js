import { createContext, useContext, useState, useCallback } from "react";
import TOUR_STEPS from "../data/tourSteps";

const TourContext = createContext(null);
const TOTAL_STEPS = TOUR_STEPS.length;

export function TourProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback((fromStep = 0) => {
    setCurrentStep(fromStep);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => {
      const next = s + 1;
      if (next >= TOTAL_STEPS) {
        setIsActive(false);
        return 0;
      }
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  return (
    <TourContext.Provider
      value={{ isActive, currentStep, totalSteps: TOTAL_STEPS, startTour, endTour, nextStep, prevStep }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be inside TourProvider");
  return ctx;
}
