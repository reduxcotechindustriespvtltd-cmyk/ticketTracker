import { createContext, useContext, useState, useCallback } from "react";
import { DEMO_TICKETS, DEMO_SUMMARY, DEMO_SYNC_STATUS, DEMO_AUDIT_TRAIL } from "../data/demoTickets";

const DemoContext = createContext(null);
const STORAGE_KEY = "tt_demo_mode";

export function DemoProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "1"
  );

  const enterDemo = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setIsDemoMode(true);
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsDemoMode(false);
  }, []);

  // Demo-mode API shims — same shape as the real API responses
  const demoFetchTickets = useCallback((params = {}) => {
    let tickets = [...DEMO_TICKETS];
    const { tag, carrier, search, departure_from, departure_to } = params;
    if (tag) tickets = tickets.filter((t) => t.tag === tag);
    if (carrier) tickets = tickets.filter((t) => t.carrier_code === carrier.toUpperCase());
    if (search) {
      const q = search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.passenger_name?.toLowerCase().includes(q) ||
          t.ticket_number?.includes(q) ||
          t.pnr_locator?.toLowerCase().includes(q)
      );
    }
    if (departure_from) tickets = tickets.filter((t) => t.departure_date >= departure_from);
    if (departure_to) tickets = tickets.filter((t) => t.departure_date <= departure_to);

    const page = params.page || 1;
    const pageSize = params.page_size || 50;
    const start = (page - 1) * pageSize;
    return Promise.resolve({
      total: tickets.length,
      page,
      page_size: pageSize,
      items: tickets.slice(start, start + pageSize),
    });
  }, []);

  const demoFetchSummary = useCallback(() => Promise.resolve(DEMO_SUMMARY), []);
  const demoFetchSyncStatus = useCallback(() => Promise.resolve(DEMO_SYNC_STATUS), []);
  const demoFetchAuditTrail = useCallback((id) => {
    if (id === 1) return Promise.resolve(DEMO_AUDIT_TRAIL);
    return Promise.resolve([]);
  }, []);
  const demoFetchConfigStatus = useCallback(() =>
    Promise.resolve({ configured: true, office_id: "BOMXX0001", portal_type: "web", last_synced_at: DEMO_SYNC_STATUS.last_sync }),
  []);

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      enterDemo,
      exitDemo,
      demoFetchTickets,
      demoFetchSummary,
      demoFetchSyncStatus,
      demoFetchAuditTrail,
      demoFetchConfigStatus,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be inside DemoProvider");
  return ctx;
}
