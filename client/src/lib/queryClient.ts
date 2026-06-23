// /src/lib/queryClient.ts
import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "http://127.0.0.1:8000/api"; // Django API

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`❌ API Error: ${res.status} ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown
): Promise<any> {
  const cleanEndpoint = endpoint.replace(/^\/?api\/?/, "").replace(/^\/+/, "");
  const url = `${API_BASE}/${cleanEndpoint}`;

  try {
    // If method is DELETE, do NOT send a body (some backends reject bodies on DELETE)
    const isDelete = method.toUpperCase() === "DELETE";

    const res = await fetch(url, {
      method,
      headers: isDelete ? undefined : { "Content-Type": "application/json" },
      body: !isDelete && data ? JSON.stringify(data) : undefined,
      mode: "cors",
      credentials: "include",
    });

    await throwIfResNotOk(res);

    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err: any) {
    console.error("🌐 Network/Fetch error:", err?.message ?? err);
    throw new Error("Backend unreachable or invalid response");
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn =
  <T,>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
    async ({ queryKey }) => {
      const endpoint = Array.isArray(queryKey) ? queryKey.join("/") : String(queryKey);
      const cleanEndpoint = String(endpoint).replace(/^\/?api\/?/, "");
      const url = `${API_BASE}/${cleanEndpoint}`;
      const res = await fetch(url, { credentials: "include" });
      if (on401 === "returnNull" && res.status === 401) return null as T;
      await throwIfResNotOk(res);
      return (await res.json()) as T;
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});

// Convenience wrappers
export async function fetchMedicines() {
  return apiRequest("GET", "medicines/");
}
export async function fetchInventory() {
  return apiRequest("GET", "inventory/");
}
export async function fetchInvoices() {
  return apiRequest("GET", "invoices/");
}
