export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;
export type BodyType<T> = T;
export type AuthTokenGetter = () => Promise<string | null> | string | null;

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;
  constructor(status: number, data: T | null, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let baseUrl = "";
let authTokenGetter: AuthTokenGetter | null = null;

export function setBaseUrl(url: string | null): void {
  baseUrl = url || "";
}

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  authTokenGetter = getter;
}

export async function customFetch<T = unknown>(
  url: string | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  const fullUrl = `${baseUrl}${url}`;
  
  const headers = new Headers(options.headers);
  if (authTokenGetter) {
    const token = await authTokenGetter();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, errorData, `HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

