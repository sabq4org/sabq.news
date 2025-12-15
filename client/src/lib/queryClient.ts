import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// CSRF Protection
function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
}

let csrfToken: string | null = null;

export async function initializeCsrf(): Promise<void> {
  try {
    const res = await fetch("/api/csrf-token", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken;
    }
  } catch (e) {
    console.error("Failed to fetch CSRF token:", e);
  }
}

function getCsrfToken(): string | null {
  return csrfToken || getCsrfTokenFromCookie();
}

function handleSessionExpiration() {
  // Store current URL for redirect after login
  const currentPath = window.location.pathname + window.location.search;
  if (currentPath !== '/login') {
    localStorage.setItem('redirectAfterLogin', currentPath);
  }
  
  // Show toast message
  toast({
    title: "انتهت صلاحية جلستك",
    description: "يرجى تسجيل الدخول مرة أخرى",
    variant: "destructive",
  });
  
  // Redirect to login after 2 seconds
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Handle 401 Unauthorized - session expired
    if (res.status === 401) {
      handleSessionExpiration();
    }
    
    // Handle 502/503/504 Gateway errors - server temporarily unavailable
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error("الخادم غير متاح مؤقتاً، يرجى المحاولة مرة أخرى");
    }
    
    // Handle 403 Forbidden - show user-friendly message
    if (res.status === 403) {
      try {
        const data = JSON.parse(text);
        if (data.message) {
          toast({
            title: "تنبيه",
            description: data.message,
            variant: "destructive",
          });
          throw new Error(data.message);
        }
      } catch (e) {
        // If parsing fails or no message, use default
        if (e instanceof Error && e.message !== text) {
          throw e; // Re-throw if it's our custom error
        }
      }
    }
    
    // Handle 409 Conflict - parse JSON and extract Arabic message
    if (res.status === 409) {
      try {
        const data = JSON.parse(text);
        if (data.message) {
          throw new Error(data.message);
        }
      } catch (e) {
        // If parsing fails, check if it's our custom error
        if (e instanceof Error && e.message !== text) {
          throw e; // Re-throw if it's our custom error
        }
      }
    }
    
    // For other errors, try to parse JSON message
    try {
      const data = JSON.parse(text);
      if (data.message) {
        throw new Error(data.message);
      }
    } catch (e) {
      // If parsing fails, check if it's our custom error
      if (e instanceof Error && e.message !== text) {
        throw e;
      }
    }
    
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
          // Handle 401 Unauthorized - session expired
          if (xhr.status === 401) {
            handleSessionExpiration();
          }
          
          // Handle 403 Forbidden - show user-friendly message
          if (xhr.status === 403) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.message) {
                toast({
                  title: "تنبيه",
                  description: data.message,
                  variant: "destructive",
                });
                reject(new Error(data.message));
                return;
              }
            } catch (e) {
              // If parsing fails, continue to default error
            }
          }
          
          // Handle 409 Conflict - parse JSON and extract Arabic message
          if (xhr.status === 409) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.message) {
                reject(new Error(data.message));
                return;
              }
            } catch (e) {
              // If parsing fails, continue to default error
            }
          }
          
          // For other errors, try to parse JSON message
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.message) {
              reject(new Error(data.message));
              return;
            }
          } catch (e) {
            // If parsing fails, continue to default error
          }
          
          reject(new Error(`${xhr.status}: ${xhr.responseText || xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open(options?.method || 'POST', url);
      xhr.withCredentials = true;
      
      // Add CSRF token for state-changing requests
      const token = getCsrfToken();
      if (token) {
        xhr.setRequestHeader("x-csrf-token", token);
      }
      
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
  const method = options?.method || "GET";
  const isStateChangingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
  const csrfTokenValue = getCsrfToken();
  
  const headers: Record<string, string> = {
    ...(options?.body && typeof options.body === 'string' ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers || {}),
  };
  
  if (isStateChangingMethod && csrfTokenValue) {
    headers["x-csrf-token"] = csrfTokenValue;
  }
  
  const res = await fetch(url, {
    method,
    headers,
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
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Performance optimization: cache data for 1 minute
      staleTime: 60000, // 1 minute - data considered fresh
      gcTime: 300000, // 5 minutes - keep in memory
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
