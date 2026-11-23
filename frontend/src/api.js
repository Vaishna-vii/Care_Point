const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export function getToken() {
  return localStorage.getItem("carepoint_token");
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export const get = (path) => api(path);
export const post = (path, data) => api(path, { method: "POST", body: JSON.stringify(data) });
export const put = (path, data) => api(path, { method: "PUT", body: JSON.stringify(data) });
export const patch = (path, data) => api(path, { method: "PATCH", body: JSON.stringify(data) });
