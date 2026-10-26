/**
 * Client de l'API CIAT. Tous les modules l'utilisent pour parler au backend.
 *
 *   const projets = await api<Page<Projet>>("/projets/");
 *   await api("/auth/token/", { method: "POST", body: { email, password }, auth: false });
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`Erreur API ${status}`);
  }
}

const ACCESS_KEY = "ciat_access";
const REFRESH_KEY = "ciat_refresh";

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getAccess(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
}

async function refreshAccess(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const data = await res.json();
  localStorage.setItem(ACCESS_KEY, data.access);
  return true;
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const send = () => {
    const h = new Headers(headers);
    if (body !== undefined && !isForm) h.set("Content-Type", "application/json");
    const token = auth ? getAccess() : null;
    if (token) h.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_URL}${path}`, {
      ...rest,
      headers: h,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  };

  let res = await send();
  if (res.status === 401 && auth && (await refreshAccess())) res = await send();

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
