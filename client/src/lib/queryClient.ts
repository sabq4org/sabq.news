import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: {
    method?: string;
    body?: string | FormData;
    headers?: Record<string, string>;
    isFormData?: boolean;
    onUploadProgress?: (progress: { loaded: number; total: number }) => void;
  }
): Promise<T> {
  // Use XMLHttpRequest for FormData with progress tracking
  if (options?.isFormData && options.body instanceof FormData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && options.onUploadProgress) {
          options.onUploadProgress({ loaded: e.loaded, total: e.total });
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const contentType = xhr.getResponseHeader("content-type");
            if (contentType && contentType.includes("application/json")) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              resolve(xhr.response);
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error}`));
          }
        } else {
          reject(new Error(`${xhr.status}: ${xhr.responseText || xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open(options?.method || 'POST', url);
      xhr.withCredentials = true;
      
      // Don't set Content-Type for FormData - browser will set it with boundary
      if (options?.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.send(options.body);
    });
  }

  // Standard fetch for non-FormData requests
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      ...(options?.body && typeof options.body === 'string' ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {}),
    },
    body: typeof options?.body === 'string' ? options.body : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  
  return res as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
