// Единая точка для HTTP. Все запросы идут на /api/*, в dev проксируются Vite на C#-бэкенд,
// в prod — через Nginx. Контракты появятся позже: менять нужно только файлы в src/api.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function http<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const USE_MOCK: boolean = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';
