import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchTickets } from "../api/tickets";
import { useDemo } from "../context/DemoContext";
import KPICards from "../components/KPICards";
import FilterBar from "../components/FilterBar";
import TicketTable from "../components/TicketTable";
import UploadModal from "../components/UploadModal";
import UploadSuccessBanner from "../components/UploadSuccessBanner";
import PageHeader from "../components/PageHeader";
import TipCard from "../components/TipCard";
import { GuideCallout } from "../components/GuideTip";
import { UploadIcon } from "../components/icons";

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const { isDemoMode, demoFetchTickets } = useDemo();
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [showUpload, setShowUpload] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", filters, page, isDemoMode],
    queryFn: () =>
      isDemoMode
        ? demoFetchTickets({ ...filters, page, page_size: pageSize })
        : fetchTickets({ ...filters, page, page_size: pageSize }),
    keepPreviousData: true,
    refetchInterval: !isDemoMode && uploadResult ? 5000 : false,
  });

  function handleFilter(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  function handleUploadSuccess(result) {
    setShowUpload(false);
    setUploadResult(result);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
  }

  const hasTickets = (data?.total ?? 0) > 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Ticket Dashboard"
        subtitle="Audit unutilised tickets and track recoverable refund value"
        action={
          !isDemoMode && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 btn-primary"
            >
              <UploadIcon className="w-4 h-4" />
              Upload CSV
            </button>
          )
        }
      />

      {/* Guide mode walkthrough */}
      <GuideCallout step={1}>
        <strong>KPI Cards</strong> below show a live summary. "No-Show" = passenger missed the flight
        (coupon NS or O past departure with no cancellation). "Cancelled Before Dep" = PNR cancelled
        before the flight left. Click the <strong className="text-amber-600">i</strong> badge on each card for a full explanation.
      </GuideCallout>

      {uploadResult && (
        <UploadSuccessBanner
          result={uploadResult}
          onDismiss={() => setUploadResult(null)}
        />
      )}

      {!hasTickets && !isLoading && !uploadResult && !isDemoMode && (
        <TipCard
          variant="info"
          title="Getting started"
          steps={[
            "Configure Amadeus GDS credentials (already done if you see this dashboard)",
            <>Go to <Link to="/sync" className="underline font-medium">Sync</Link> and run a manual date-range sync to discover tickets</>,
            "Or upload a CSV of 13-digit ticket numbers using the button above",
            <>Set per-carrier penalties in <Link to="/refund-rules" className="underline font-medium">Refund Rules</Link> for accurate net refund calculations</>,
          ]}
        />
      )}

      <KPICards />

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      <GuideCallout step={2}>
        <strong>Filter Bar</strong> — Use the <em>Tag</em> dropdown to instantly narrow to recoverable
        tickets. Try selecting "No-Show" or "Cancelled Before Dep". Use the search box and press
        <strong> Enter</strong> to find a passenger or ticket number.
      </GuideCallout>

      <FilterBar onFilter={handleFilter} />

      <GuideCallout step={3}>
        <strong>Ticket Table</strong> — Each row is one ticket. Click any row to see the full detail,
        raw Amadeus TWD output, and penalty breakdown. The <em>Net Refund</em> column is the amount
        you can actually recover after applying the airline's penalty. <em>Expiry</em> shows days
        until the refund window closes — <strong className="text-red-700">red = urgent action needed</strong>.
      </GuideCallout>

      <TicketTable
        tickets={data?.items || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
