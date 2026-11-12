/**
 * Centralized API configuration for Render & Vercel deployment.
 *
 * When deployed on Vercel:
 * Set VITE_API_BASE_URL=https://<your-render-service>.onrender.com
 *
 * When running locally or unified with Docker:
 * Defaults to relative '' so it routes through Vite proxy or Django directly.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const API_ENDPOINTS = {
  PRESETS: `${API_BASE_URL}/api/presets/`,
  ANALYZE: `${API_BASE_URL}/api/routes/analyze/`,
  GEOCODE: (q, limit = 5) => `${API_BASE_URL}/api/geocode/?q=${encodeURIComponent(q)}&limit=${limit}`,
};
