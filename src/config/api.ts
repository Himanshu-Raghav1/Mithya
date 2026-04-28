// ============================================================
// MITHYA - Centralized API Configuration
// ============================================================
// DEPLOYMENT: Change ONLY this file when switching environments.
//   Local dev  → http://127.0.0.1:5000
//   Azure Prod → https://your-flask-api.azurewebsites.net
//
// Set the env variable in Azure Static Web App Application Settings:
//   Key:   VITE_API_BASE_URL
//   Value: https://your-flask-api.azurewebsites.net
// ============================================================

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:5000';

export const API_TIMEOUT_MS = 20000; // 20s — allows Render cold starts to succeed
