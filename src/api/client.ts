const TOKEN_KEY = 'synapse:token';

/** An error answered by the API as `{ error: { code, message } }`, or a network failure */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable: the login lasts until the tab is reloaded
  }
};

// Called when the API rejects the stored token, so the app can drop the session
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export const api = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Não foi possível falar com o servidor. Verifique sua conexão.');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new ApiError(
      res.status,
      data?.error?.code ?? 'unknown_error',
      data?.error?.message ?? 'O servidor não respondeu como esperado. Tente novamente.'
    );
    // A rejected token (not a wrong password on the login form) ends the session
    if (res.status === 401 && token && error.code === 'unauthorized') onUnauthorized?.();
    throw error;
  }
  return data as T;
};

export const errorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Algo deu errado. Tente novamente.';
