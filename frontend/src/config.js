const rawUrl = (import.meta.env.VITE_API_URL || "http://localhost:8001").trim();
// Strip trailing slashes and redundant /api or /api/v1 path segments if configured
export const BASE_URL = rawUrl.replace(/\/+$/, "").replace(/\/api(\/v1)?\/?$/, "");
