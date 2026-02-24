const getBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return envBase?.replace(/\/$/, "") ?? "";
};

export type ApiFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  accessToken?: string | null;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("dengtai_auth_tokens");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
};

async function doFetch<TResponse>(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
  isFormData: boolean,
  signal?: AbortSignal,
): Promise<Response> {
  return fetch(url, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    signal,
    credentials: "include"
  });
}

function buildErrorMessage(rawText: string, status: number): { message: string; data: unknown } {
  let errorData: unknown = rawText;
  if (rawText) {
    try { errorData = JSON.parse(rawText); } catch { /* keep raw */ }
  }
  const message = typeof errorData === "object" && errorData !== null && "message" in errorData
    ? (errorData as { message: string }).message
    : rawText || `请求失败：${status}`;
  return { message, data: errorData };
}

export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const { method = "GET", headers = {}, body, accessToken, signal } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...headers
  };

  const tokenWasAutoAttached = accessToken === undefined;
  const token = tokenWasAutoAttached ? getStoredAccessToken() : accessToken;
  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const methodUpper = method.toUpperCase();
  const isIdempotent = methodUpper === "GET" || methodUpper === "HEAD" || methodUpper === "OPTIONS";
  if (!isIdempotent && typeof document !== "undefined") {
    try {
      const cookies = document.cookie ?? "";
      const match = cookies.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
      const xsrfToken = match ? decodeURIComponent(match[1]) : null;
      if (xsrfToken && !("X-XSRF-TOKEN" in mergedHeaders)) {
        mergedHeaders["X-XSRF-TOKEN"] = xsrfToken;
      }
    } catch { /* ignore */ }
  }

  const url = baseUrl ? `${baseUrl}${path}` : path;
  let response = await doFetch(url, method, mergedHeaders, body, isFormData, signal);

  if (response.status === 401 && tokenWasAutoAttached && token) {
    delete mergedHeaders.Authorization;
    response = await doFetch(url, method, mergedHeaders, body, isFormData, signal);
  }

  if (!response.ok) {
    let rawText = "";
    try { rawText = await response.text(); } catch { rawText = ""; }
    const { message, data } = buildErrorMessage(rawText, response.status);
    throw new ApiError(response.status, message, data);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as TResponse;
  }

  return (await response.text()) as TResponse;
}
