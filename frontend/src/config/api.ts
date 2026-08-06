const configuredOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

// VITE_API_URL is the Django deployment origin, without /api.
// It defaults to the local Django server for development.
export const API_ORIGIN = configuredOrigin || "http://localhost:8000";
export const API_BASE_URL = `${API_ORIGIN}/api`;
