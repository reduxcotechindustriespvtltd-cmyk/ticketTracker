/**
 * Realistic demo tickets — Indian domestic & international routes.
 * Used when Demo Mode is active so the app is fully explorable without real Amadeus credentials.
 */
export const DEMO_TICKETS = [
  {
    id: 1,
    ticket_number: "0982345678901",
    pnr_locator: "ABCD12",
    passenger_name: "SHARMA/RAJESH",
    route: "BOM-DEL",
    origin: "BOM", destination: "DEL", carrier_code: "6E",
    departure_date: "2026-04-15", issue_date: "2026-03-10",
    coupon_status: "NS", tag: "no_show", fare_basis_code: "SSAVER",
    base_fare: 4200, tax_amount: 812, total_fare: 5012, currency: "INR",
    cancellation_penalty: 4200, net_refund_amount: 812,
    days_until_expiry: -52, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-04-16T04:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-03-10T08:00:00Z",
  },
  {
    id: 2,
    ticket_number: "0981122334455",
    pnr_locator: "EFGH34",
    passenger_name: "MEHTA/PRIYA",
    route: "DEL-BLR",
    origin: "DEL", destination: "BLR", carrier_code: "AI",
    departure_date: "2026-04-22", issue_date: "2026-03-18",
    coupon_status: "NS", tag: "no_show", fare_basis_code: "YFLEX",
    base_fare: 7800, tax_amount: 1240, total_fare: 9040, currency: "INR",
    cancellation_penalty: 7800, net_refund_amount: 1240,
    days_until_expiry: -45, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-04-23T04:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-03-18T09:00:00Z",
  },
  {
    id: 3,
    ticket_number: "0989988776655",
    pnr_locator: "IJKL56",
    passenger_name: "GUPTA/AMIT",
    route: "BOM-HYD",
    origin: "BOM", destination: "HYD", carrier_code: "6E",
    departure_date: "2026-05-01", issue_date: "2026-03-25",
    coupon_status: "O", tag: "no_show", fare_basis_code: "SSAVER",
    base_fare: 3100, tax_amount: 620, total_fare: 3720, currency: "INR",
    cancellation_penalty: 3100, net_refund_amount: 620,
    days_until_expiry: -36, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-05-02T04:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-03-25T11:00:00Z",
  },
  {
    id: 4,
    ticket_number: "0985544332211",
    pnr_locator: "MNOP78",
    passenger_name: "SINGH/HARPREET",
    route: "DEL-DXB",
    origin: "DEL", destination: "DXB", carrier_code: "AI",
    departure_date: "2026-04-28", issue_date: "2026-03-01",
    coupon_status: "NS", tag: "no_show", fare_basis_code: "YLOWRT",
    base_fare: 18500, tax_amount: 3200, total_fare: 21700, currency: "INR",
    cancellation_penalty: 18500, net_refund_amount: 3200,
    days_until_expiry: -39, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-04-29T04:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-03-01T07:00:00Z",
  },
  // --- Cancelled Before Departure ---
  {
    id: 5,
    ticket_number: "0983344556677",
    pnr_locator: "QRST90",
    passenger_name: "PATEL/NISHA",
    route: "BOM-GOI",
    origin: "BOM", destination: "GOI", carrier_code: "SG",
    departure_date: "2026-05-05", issue_date: "2026-04-01",
    coupon_status: "O", tag: "cancelled_before_dep", fare_basis_code: "SAVER",
    base_fare: 2800, tax_amount: 540, total_fare: 3340, currency: "INR",
    cancellation_penalty: 1500, net_refund_amount: 1840,
    days_until_expiry: -32, sync_status: "synced",
    pnr_cancelled_at: "2026-04-30T12:00:00Z", categorised_at: "2026-04-30T12:30:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-04-01T10:00:00Z",
  },
  {
    id: 6,
    ticket_number: "0987766554433",
    pnr_locator: "UVWX12",
    passenger_name: "REDDY/KRISHNA",
    route: "HYD-BOM",
    origin: "HYD", destination: "BOM", carrier_code: "UK",
    departure_date: "2026-05-12", issue_date: "2026-04-10",
    coupon_status: "O", tag: "cancelled_before_dep", fare_basis_code: "FLEX50",
    base_fare: 5600, tax_amount: 980, total_fare: 6580, currency: "INR",
    cancellation_penalty: 3000, net_refund_amount: 3580,
    days_until_expiry: -25, sync_status: "synced",
    pnr_cancelled_at: "2026-05-08T15:00:00Z", categorised_at: "2026-05-08T15:30:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-04-10T09:00:00Z",
  },
  {
    id: 7,
    ticket_number: "0984433221100",
    pnr_locator: "YZAB34",
    passenger_name: "IYER/LAKSHMI",
    route: "BLR-DEL",
    origin: "BLR", destination: "DEL", carrier_code: "6E",
    departure_date: "2026-05-20", issue_date: "2026-04-20",
    coupon_status: "O", tag: "cancelled_before_dep", fare_basis_code: "SSAVER",
    base_fare: 4100, tax_amount: 790, total_fare: 4890, currency: "INR",
    cancellation_penalty: 2500, net_refund_amount: 2390,
    days_until_expiry: -17, sync_status: "synced",
    pnr_cancelled_at: "2026-05-15T09:00:00Z", categorised_at: "2026-05-15T09:30:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-04-20T11:00:00Z",
  },
  // --- Active (future travel) ---
  {
    id: 8,
    ticket_number: "0986655443322",
    pnr_locator: "CDEF56",
    passenger_name: "VERMA/SANJAY",
    route: "DEL-BOM",
    origin: "DEL", destination: "BOM", carrier_code: "6E",
    departure_date: "2026-07-10", issue_date: "2026-06-01",
    coupon_status: "O", tag: "active", fare_basis_code: "SSAVER",
    base_fare: 3500, tax_amount: 680, total_fare: 4180, currency: "INR",
    cancellation_penalty: null, net_refund_amount: 0,
    days_until_expiry: 33, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-06-01T12:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-06-01T08:00:00Z",
  },
  {
    id: 9,
    ticket_number: "0981234509876",
    pnr_locator: "GHIJ78",
    passenger_name: "BOSE/ANANYA",
    route: "BOM-SIN",
    origin: "BOM", destination: "SIN", carrier_code: "AI",
    departure_date: "2026-08-05", issue_date: "2026-05-30",
    coupon_status: "O", tag: "active", fare_basis_code: "YLOWRT",
    base_fare: 22000, tax_amount: 4100, total_fare: 26100, currency: "INR",
    cancellation_penalty: null, net_refund_amount: 0,
    days_until_expiry: 59, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-05-30T14:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-05-30T09:00:00Z",
  },
  // --- Used ---
  {
    id: 10,
    ticket_number: "0985566778899",
    pnr_locator: "KLMN90",
    passenger_name: "KAPOOR/ROHIT",
    route: "BOM-DEL",
    origin: "BOM", destination: "DEL", carrier_code: "UK",
    departure_date: "2026-04-05", issue_date: "2026-03-20",
    coupon_status: "F", tag: "used", fare_basis_code: "FLEX50",
    base_fare: 5200, tax_amount: 950, total_fare: 6150, currency: "INR",
    cancellation_penalty: 0, net_refund_amount: 0,
    days_until_expiry: -62, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-04-06T04:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-03-20T10:00:00Z",
  },
  {
    id: 11,
    ticket_number: "0983322114455",
    pnr_locator: "OPQR12",
    passenger_name: "JOSHI/MEENA",
    route: "DEL-CCU",
    origin: "DEL", destination: "CCU", carrier_code: "6E",
    departure_date: "2026-04-18", issue_date: "2026-04-01",
    coupon_status: "F", tag: "used", fare_basis_code: "SSAVER",
    base_fare: 3800, tax_amount: 720, total_fare: 4520, currency: "INR",
    cancellation_penalty: 0, net_refund_amount: 0,
    days_until_expiry: -49, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: "2026-04-19T04:00:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-04-01T09:00:00Z",
  },
  // --- Refunded ---
  {
    id: 12,
    ticket_number: "0987788990011",
    pnr_locator: "STUV34",
    passenger_name: "AGARWAL/DEEPAK",
    route: "BOM-HYD",
    origin: "BOM", destination: "HYD", carrier_code: "SG",
    departure_date: "2026-04-10", issue_date: "2026-03-15",
    coupon_status: "R", tag: "refunded", fare_basis_code: "SAVER",
    base_fare: 2600, tax_amount: 510, total_fare: 3110, currency: "INR",
    cancellation_penalty: 1500, net_refund_amount: 0,
    days_until_expiry: -57, sync_status: "synced",
    pnr_cancelled_at: "2026-04-05T10:00:00Z", categorised_at: "2026-04-05T10:30:00Z",
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-03-15T11:00:00Z",
  },
  // --- Airport Control (retry) ---
  {
    id: 13,
    ticket_number: "0986677889900",
    pnr_locator: "WXYZ56",
    passenger_name: "MALHOTRA/VIVEK",
    route: "DEL-BLR",
    origin: "DEL", destination: "BLR", carrier_code: "AI",
    departure_date: "2026-06-05", issue_date: "2026-05-10",
    coupon_status: "A", tag: "retry_48hrs", fare_basis_code: "YFLEX",
    base_fare: 6200, tax_amount: 1100, total_fare: 7300, currency: "INR",
    cancellation_penalty: null, net_refund_amount: 0,
    days_until_expiry: -2, sync_status: "processing",
    pnr_cancelled_at: null, categorised_at: null,
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-05-10T12:00:00Z",
  },
  // --- Manual Check ---
  {
    id: 14,
    ticket_number: "0984455667788",
    pnr_locator: null,
    passenger_name: "KHANNA/RITU",
    route: "BOM-DXB",
    origin: "BOM", destination: "DXB", carrier_code: "UK",
    departure_date: "2026-03-15", issue_date: "2026-01-20",
    coupon_status: "O", tag: "manual_check", fare_basis_code: null,
    base_fare: 15000, tax_amount: 2800, total_fare: 17800, currency: "INR",
    cancellation_penalty: null, net_refund_amount: null,
    days_until_expiry: -83, sync_status: "synced",
    pnr_cancelled_at: null, categorised_at: null,
    last_synced_at: "2026-06-05T10:30:00Z", created_at: "2026-01-20T08:00:00Z",
  },
];

export const DEMO_SUMMARY = {
  total_tickets: DEMO_TICKETS.length,
  no_show: DEMO_TICKETS.filter((t) => t.tag === "no_show").length,
  cancelled_before_dep: DEMO_TICKETS.filter((t) => t.tag === "cancelled_before_dep").length,
  total_recoverable_value: DEMO_TICKETS.filter((t) =>
    ["no_show", "cancelled_before_dep"].includes(t.tag) && t.net_refund_amount > 0
  ).reduce((sum, t) => sum + t.net_refund_amount, 0),
  recoverable_tickets: DEMO_TICKETS.filter((t) =>
    ["no_show", "cancelled_before_dep"].includes(t.tag) && t.net_refund_amount > 0
  ).length,
};

export const DEMO_SYNC_STATUS = {
  last_sync: "2026-06-05T10:30:00Z",
  tickets_fetched: DEMO_TICKETS.length,
  tickets_flagged: DEMO_SUMMARY.no_show + DEMO_SUMMARY.cancelled_before_dep,
  duration_ms: 4820,
  errors: null,
};

export const DEMO_AUDIT_TRAIL = [
  {
    id: 1,
    command_used: "TWD/TKT0982345678901",
    raw_response: `TWD/TKT-0982345678901
1. SHARMA/RAJESH
RLOC ABCD12
BOM 6E 123 Y 15APR 1030 O NO-SHOW

FARE INR 4200
TAX  INR  812
TOT  INR 5012
FARE BASIS: SSAVER`,
    parsed_at: "2026-06-05T10:30:12Z",
  },
  {
    id: 2,
    command_used: "RT ABCD12",
    raw_response: `RT ABCD12
1. SHARMA/RAJESH MR
BOM 6E 123 Y 15APR/1030 BOMDEL NN1 HK1
TKT-0982345678901 ISSUED 10MAR26`,
    parsed_at: "2026-06-05T10:30:15Z",
  },
  {
    id: 3,
    command_used: "RH",
    raw_response: `RH ABCD12
RF BOM 10MAR26/0800Z SHARMA
RT BOM 10MAR26/0801Z SHARMA
TKT BOM 10MAR26/0802Z AMADEUS`,
    parsed_at: "2026-06-05T10:30:17Z",
  },
];
