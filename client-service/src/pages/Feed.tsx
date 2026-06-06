import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Thread } from '../api';
import { useSession } from '../session';

export function Feed() {
  const { user } = useSession();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setThreads(await api.listThreads());
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
        <form onSubmit={onSubmit}>
          <label>
            new thread
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              placeholder="What's on your mind?"
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={busy || !content.trim()}>Post</button>
        </form>
      )}
      {threads.length === 0 && <p>No threads yet.</p>}
      {threads.map((t) => (
        <article key={t.id} className="post">
          <div className="meta">
            <strong>{t.author.displayName}</strong> @{t.author.username} ·{' '}
            {new Date(t.createdAt).toLocaleString()}
          </div>
          <Link to={`/threads/${t.id}`}>
            <div className="content">{t.content}</div>
          </Link>
        </article>
      ))}
    </>
  );
}
