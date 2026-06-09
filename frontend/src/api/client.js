import axios from "axios";

const STORAGE_KEY = "tt_token";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export function setToken(token) {
  sessionStorage.setItem(STORAGE_KEY, token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export function clearToken() {
  sessionStorage.removeItem(STORAGE_KEY);
  delete api.defaults.headers.common["Authorization"];
}

export function getStoredToken() {
  return sessionStorage.getItem(STORAGE_KEY);
}

// Restore token on module load (survives page refresh, cleared on tab close)
const stored = getStoredToken();
if (stored) {
  api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
