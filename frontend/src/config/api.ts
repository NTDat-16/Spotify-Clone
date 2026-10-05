const configuredOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

// VITE_API_URL is the Django deployment origin (e.g. https://spotify-clone-backend.vercel.app).
// - When configured, use that domain.
// - In local development (npm run dev), default to local Django server (http://localhost:8000).
// - In production when not explicitly configured, default to same-origin relative path ("")
//   so requests query the deployed server (/api/...) instead of dead localhost:8000!
export const API_ORIGIN =
  configuredOrigin !== undefined && configuredOrigin !== ""
    ? configuredOrigin
    : import.meta.env.DEV
    ? "http://localhost:8000"
    : "";

export const API_BASE_URL = `${API_ORIGIN}/api`;

