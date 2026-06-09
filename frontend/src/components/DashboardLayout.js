import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAmadeusConfig } from "../hooks/useAmadeusConfig";
import { useDemo } from "../context/DemoContext";
import { useGuideMode } from "../context/GuideModeContext";
import { useTour } from "../context/TourContext";
import DemoModeBanner from "./DemoModeBanner";
import HelpDrawer from "./HelpDrawer";
import {
  LogoIcon, TicketIcon, SyncIcon, RulesIcon, SettingsIcon, LogoutIcon, ShieldIcon,
} from "./icons";

const navItems = [
  { to: "/", label: "Tickets", icon: TicketIcon, end: true },
  { to: "/sync", label: "Sync", icon: SyncIcon, tourId: "nav-sync" },
  { to: "/refund-rules", label: "Refund Rules", icon: RulesIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const PAGE_TITLES = {
  "/": "Tickets",
  "/sync": "Sync",
  "/refund-rules": "Refund Rules",
  "/settings": "Settings",
};

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const { officeId, lastSyncedAt } = useAmadeusConfig();
  const { isDemoMode, enterDemo, exitDemo } = useDemo();
  const { isGuideMode, toggleGuideMode } = useGuideMode();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  function handleGuideToggle() {
    const willBeOn = !isGuideMode;
    toggleGuideMode();
    if (willBeOn) setTimeout(() => startTour(), 80);
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 flex-col">
      <DemoModeBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <LogoIcon className="w-8 h-8" />
              <div>
                <h1 className="text-base font-bold tracking-tight">TicketTrack</h1>
                <p className="text-slate-400 text-[11px]">Refund Recovery</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon, end, tourId }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                data-tour={tourId}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </NavLink>
            ))}

            {/* Help & Guidance — single entry that opens the bottom drawer */}
            <div className="pt-3 mt-3 border-t border-white/10">
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-white/5 transition-all group text-left"
              >
                {/* Circle question-mark icon */}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-[18px] h-[18px] text-slate-400 group-hover:text-white transition-colors flex-shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    Help &amp; Guidance
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Tour · tips · demo
                  </p>
                </div>
                {/* Up-arrow hint */}
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0"
                >
                  <path d="M8 3.293l-4.354 4.353a.5.5 0 00.708.708L8 4.707l3.646 3.647a.5.5 0 00.708-.708L8 3.293z" />
                  <path d="M8 8.293l-4.354 4.353a.5.5 0 00.708.708L8 9.707l3.646 3.647a.5.5 0 00.708-.708L8 8.293z" />
                </svg>
              </button>
            </div>
          </nav>

          <div className="px-4 py-4 border-t border-white/10 space-y-3">
            {(officeId || isDemoMode) && (
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5">
                <ShieldIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">
                    {isDemoMode ? "Demo Office" : "GDS Connected"}
                  </p>
                  <p className="text-xs font-medium text-white truncate">
                    {isDemoMode ? "BOMXX0001 (demo)" : officeId}
                  </p>
                </div>
              </div>
            )}
            <div className="px-2">
              <p className="text-slate-400 text-xs truncate">
                {isDemoMode ? "demo@tickettrack.io" : user?.email}
              </p>
              {isDemoMode ? (
                <button
                  onClick={exitDemo}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 mt-1.5 transition-colors"
                >
                  Exit Demo
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-white mt-1.5 transition-colors"
                >
                  <LogoutIcon className="w-3.5 h-3.5" />
                  Sign out
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-800">{pageTitle}</h2>
              {isGuideMode && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  🧭 Guide Mode ON — hover the <strong className="font-bold">i</strong> badges for tips
                </span>
              )}
              {isDemoMode && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  🎭 Demo Data
                </span>
              )}
            </div>
            {lastSyncedAt && !isDemoMode && (
              <p className="text-xs text-slate-400">
                Last sync: {new Date(lastSyncedAt).toLocaleString()}
              </p>
            )}
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Help & Guidance bottom drawer */}
      <HelpDrawer
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        isGuideMode={isGuideMode}
        onGuideToggle={handleGuideToggle}
        isDemoMode={isDemoMode}
        onDemoToggle={isDemoMode ? exitDemo : enterDemo}
        onStartTour={startTour}
      />
    </div>
  );
}
