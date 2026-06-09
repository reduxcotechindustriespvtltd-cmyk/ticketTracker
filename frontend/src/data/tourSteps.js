const TOUR_STEPS = [
  {
    target: null,
    title: "Welcome to TicketTrack",
    emoji: "✈️",
    content:
      "This quick tour walks you through every key feature — from discovering tickets to filing refunds. Use the buttons below or arrow keys to navigate.",
  },
  {
    target: "kpi-section",
    title: "Live KPI Dashboard",
    content:
      "4 cards updated on every sync. See total tickets discovered, no-shows, cancellations, and your aggregate recoverable ₹ value at a glance.",
  },
  {
    target: "kpi-no-show",
    title: "No-Show Count",
    content:
      "Passenger missed the flight — coupon left Open (O) or Not Shown (NS). Only taxes are refundable; the base fare is typically forfeited by the airline.",
  },
  {
    target: "kpi-cancelled",
    title: "Cancelled Before Dep",
    content:
      "PNR was cancelled before departure. A per-carrier penalty applies, but the remaining fare is refundable. Set penalty rules per carrier in Refund Rules.",
  },
  {
    target: "kpi-recoverable",
    title: "Total Recoverable Value",
    content:
      "Real money sitting unclaimed — sum of Net Refund amounts across all actionable tickets. Every day you wait risks the refund window closing permanently.",
  },
  {
    target: "filter-bar",
    title: "Filter & Search",
    content:
      "Narrow tickets by tag, carrier code, departure date range, or passenger name / ticket number. Dropdowns and dates apply instantly — no Apply click needed.",
  },
  {
    target: "filter-tag",
    title: "Tag Filter — Most Important",
    content:
      "Select 'No-Show' or 'Cancelled Before Dep' to show only actionable tickets. Use this at the start of every filing session to focus on what you can actually claim.",
  },
  {
    target: "ticket-table",
    title: "Ticket Table",
    content:
      "Every discovered ticket appears here. Click any row to drill into the full Amadeus TWD output, fare breakdown, and the exact refund calculation. Paginated 50 per page.",
  },
  {
    target: "col-net-refund",
    title: "Net Refund Column",
    content:
      "The actual ₹ amount you can claim. Cancelled tickets: Total Fare − Penalty. No-shows: Tax Amount only. This is the number you file for with the airline.",
  },
  {
    target: "col-expiry",
    title: "Expiry Countdown",
    content:
      "Days until the refund window closes. Red (< 7 days) means file immediately. Most airlines require refund claims within 90–365 days of the ticket issue date.",
  },
  {
    target: "nav-sync",
    title: "Sync with Amadeus GDS",
    content:
      "Trigger a full GDS discovery here. TicketTrack issues TJQ / RTD commands to find tickets, then enriches each one via TWD → RH → FQD pipeline to compute refund amounts automatically.",
  },
  {
    target: "nav-guide",
    title: "Guide Mode",
    content:
      "Keep Guide Mode ON for contextual ⓘ badges throughout the app. Hover any badge for a detailed explanation of that section. Toggle off when you're fully comfortable.",
  },
  {
    target: null,
    title: "You're all set!",
    emoji: "🎯",
    content:
      "You know the full flow: Sync → Review tickets → Filter to actionable ones → File refunds. The ⓘ badges give you context help at any point.",
  },
];

export default TOUR_STEPS;
