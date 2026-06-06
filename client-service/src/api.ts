const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Author = { id: string; username: string; displayName: string };
export type Thread = {
  id: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  author: Author;
};
export type ThreadWithReplies = Thread & { replies: Thread[] };
export type SessionUser = { id: string; email: string; username: string; displayName: string };
export type AuthResponse = { token: string; user: SessionUser };

const TOKEN_KEY = 'goodshares.token';
const USER_KEY = 'goodshares.user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function saveSession(res: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, res.token);
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? res.statusText;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  register: (input: { email: string; password: string; username: string; displayName: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  listThreads: () => request<Thread[]>('/threads'),
  getThread: (id: string) => request<ThreadWithReplies>(`/threads/${id}`),
  createThread: (content: string) =>
    request<Thread>('/threads', { method: 'POST', body: JSON.stringify({ content }) }),
  reply: (id: string, content: string) =>
    request<Thread>(`/threads/${id}/replies`, { method: 'POST', body: JSON.stringify({ content }) }),
};
