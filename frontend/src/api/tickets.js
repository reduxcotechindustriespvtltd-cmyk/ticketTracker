import api from "./client";

export const fetchTickets = (params) => api.get("/tickets", { params }).then((r) => r.data);
export const fetchTicket = (id) => api.get(`/tickets/${id}`).then((r) => r.data);
export const fetchSummary = () => api.get("/tickets/summary").then((r) => r.data);
export const fetchAuditTrail = (id) => api.get(`/audit-trail/${id}`).then((r) => r.data);
export const login = (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data);
export const logout = () => api.post("/auth/logout");
export const triggerSync = (body) => api.post("/sync/manual", body).then((r) => r.data);
export const fetchSyncStatus = () => api.get("/sync/status").then((r) => r.data);
export const saveAmadeusConfig = (body) => api.post("/amadeus/config", body).then((r) => r.data);
export const fetchAmadeusConfig = () => api.get("/amadeus/config").then((r) => r.data);
export const fetchAmadeusConfigStatus = () => api.get("/amadeus/config/status").then((r) => r.data);
export const fetchRefundRules = () => api.get("/refund-rules").then((r) => r.data);
export const updateRefundRule = (carrier, body) => api.put(`/refund-rules/${carrier}`, body).then((r) => r.data);

export const uploadCSV = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload/csv", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};
