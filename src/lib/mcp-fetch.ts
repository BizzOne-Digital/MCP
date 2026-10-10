export const MCP_NETWORK_ERROR =
  "Could not reach the server. Check that the app is running (npm run start after build) and you are on the correct URL.";
export async function mcpFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

export type McpJsonResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: T; networkError?: boolean };

export function isMcpNetworkError<T>(result: McpJsonResult<T>): boolean {
  return !result.ok && result.networkError === true;
}

export async function mcpJson<T>(
  path: string,
  init?: RequestInit
): Promise<McpJsonResult<T>> {
  try {
    const res = await mcpFetch(path, init);
    let data: T;
    try {
      data = (await res.json()) as T;
    } catch {
      data = {} as T;
    }
    if (res.ok) {
      return { ok: true, status: res.status, data };
    }
    return { ok: false, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: {} as T,
      networkError: true,
    };
  }
}
