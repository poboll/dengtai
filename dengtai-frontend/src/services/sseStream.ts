const getBaseUrl = (): string => {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return envBase?.replace(/\/$/, "") ?? "";
};

const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("dengtai_auth_tokens");
    if (!raw) return null;
    return (JSON.parse(raw) as { accessToken?: string }).accessToken ?? null;
  } catch {
    return null;
  }
};

export type SSECallbacks = {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
  accessToken?: string | null;
};

export async function fetchSSE(path: string, cb: SSECallbacks): Promise<void> {
  const { onChunk, onDone, onError, signal, accessToken } = cb;
  const base = getBaseUrl();
  const url = base ? `${base}${path}` : path;

  const token = accessToken === undefined ? getStoredAccessToken() : accessToken;
  const headers: Record<string, string> = { Accept: "text/event-stream" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal,
      credentials: "include",
    });

    if (!res.ok) throw new Error(`SSE ${res.status}: ${res.statusText}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error("响应体不可读");

    const decoder = new TextDecoder();
    let buf = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop() ?? "";

      for (const evt of events) {
        for (const line of evt.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const raw = line.charAt(5) === " " ? line.slice(6) : line.slice(5);
          if (raw === "[DONE]") continue;
          onChunk(raw);
        }
      }
    }

    if (buf.trim()) {
      for (const line of buf.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const raw = line.charAt(5) === " " ? line.slice(6) : line.slice(5);
        if (raw !== "[DONE]") onChunk(raw);
      }
    }

    onDone();
  } catch (err) {
    if (signal?.aborted) {
      onDone();
      return;
    }
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
