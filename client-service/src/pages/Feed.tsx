import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Thread } from '../api';
import { useSession } from '../session';

function UserIcon() {
  return (
    <div className="avatar">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Feed() {
  const { user } = useSession();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setThreads(await api.listThreads());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createThread(content.trim());
      setContent('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Feed</h1>

      {user && (
        <div className="compose">
          <form onSubmit={onSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              placeholder="What's on your mind?"
            />
            {error && <div className="error">{error}</div>}
            <div className="compose-footer">
              <span className="compose-hint">{content.length}/500</span>
              <button type="submit" disabled={busy || !content.trim()}>
                {busy ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="loading">Loading threads…</p>}

      {!loading && threads.length === 0 && (
        <div className="empty-state">
          No threads yet. Be the first to post!
        </div>
      )}

      {threads.map((t) => (
        <article key={t.id} className="post">
          <div className="meta">
            <UserIcon />
            <strong>{t.author.displayName}</strong>
            <span className="handle">@{t.author.username}</span>
            <span className="dot" />
            <span className="time">{timeAgo(t.createdAt)}</span>
          </div>
          <Link to={`/threads/${t.id}`}>
            <div className="content">{t.content}</div>
          </Link>
        </article>
      ))}
    </>
  );
}
