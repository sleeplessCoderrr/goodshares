import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useSession } from '../session';

export function Register() {
  const { signIn } = useSession();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.register(form);
      signIn(res);
      nav('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Create account</h1>
      <form onSubmit={onSubmit}>
        <label>
          Display name
          <input
            id="reg-displayname"
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            placeholder="Alice"
            required
          />
        </label>
        <label>
          Username
          <input
            id="reg-username"
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            placeholder="alice_99"
            required
          />
        </label>
        <label>
          Email
          <input
            id="reg-email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password <span style={{ fontWeight: 400, opacity: 0.6 }}>(min 8 chars)</span>
          <input
            id="reg-password"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button id="reg-submit" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>Have an account? <Link to="/login">Sign in</Link></p>
    </div>
  );
}
