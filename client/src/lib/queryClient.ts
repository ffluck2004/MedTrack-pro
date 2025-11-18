import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "http://127.0.0.1:8000/api"; // ✅ Django backend URL

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`❌ API Error: ${res.status} ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

// ✅ Improved request function
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown
): Promise<any> {
  const cleanEndpoint = endpoint.replace(/^\/?api\/?/, "");
  const url = `${API_BASE}/${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
      mode: "cors",
      credentials: "include",
    });

    await throwIfResNotOk(res);

    // ✅ Handle empty body (like 201 Created with no JSON)
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err: any) {
    console.error("🌐 Network/Fetch error:", err.message);
    throw new Error("Backend unreachable or invalid response");
  }
}

// ✅ For React Query fetches
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn =
  <T,>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const endpoint = queryKey.join("/");
    const cleanEndpoint = endpoint.replace(/^\/?api\/?/, "");
    const url = `${API_BASE}/${cleanEndpoint}`;
    const res = await fetch(url, { credentials: "include" });
    if (on401 === "returnNull" && res.status === 401) return null as T;
    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

// ✅ Global query client
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

// ✅ Extra helpers for API usage directly
export async function fetchMedicines() {
  return apiRequest("GET", "medicines/");
}

export async function fetchInventory() {
  return apiRequest("GET", "inventory/");
}

export async function fetchInvoices() {
  return apiRequest("GET", "invoices/");
}
