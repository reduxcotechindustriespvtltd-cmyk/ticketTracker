import { useLocation } from "react-router-dom";
import { useAmadeusConfig } from "../hooks/useAmadeusConfig";
import SetupWizard from "./SetupWizard";

export default function CredentialsGate({ children }) {
  const { isConfigured, isLoading } = useAmadeusConfig();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured && location.pathname !== "/settings") {
    return <SetupWizard />;
  }

  return children;
}
