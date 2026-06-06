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
    <>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <label>
          email
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </label>
        <label>
          username
          <input value={form.username} onChange={(e) => set('username', e.target.value)} required />
        </label>
        <label>
          display name
          <input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} required />
        </label>
        <label>
          password
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={busy}>{busy ? '...' : 'Create account'}</button>
      </form>
      <p>Have an account? <Link to="/login">Login</Link></p>
    </>
  );
}
