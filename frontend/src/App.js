import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { DemoProvider, useDemo } from "./context/DemoContext";
import { GuideModeProvider } from "./context/GuideModeContext";
import { TourProvider } from "./context/TourContext";
import TourOverlay from "./components/TourOverlay";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import CredentialsGate from "./components/CredentialsGate";
import TicketsPage from "./pages/TicketsPage";
import SyncPage from "./pages/SyncPage";
import SettingsPage from "./pages/SettingsPage";
import RefundRulesPage from "./pages/RefundRulesPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Demo mode bypasses auth — all data is local, no API calls
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const { isDemoMode } = useDemo();
  return (isAuthenticated || isDemoMode) ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoProvider>
          <GuideModeProvider>
            <TourProvider>
              <TourOverlay />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <CredentialsGate>
                          <DashboardLayout />
                        </CredentialsGate>
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<TicketsPage />} />
                    <Route path="sync" element={<SyncPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="refund-rules" element={<RefundRulesPage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </TourProvider>
          </GuideModeProvider>
        </DemoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
