import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Thread, ThreadWithReplies } from '../api';
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

function PostBlock({ t }: { t: Thread }) {
  return (
    <article className="post">
      <div className="meta">
        <UserIcon />
        <strong>{t.author.displayName}</strong>
        <span className="handle">@{t.author.username}</span>
        <span className="dot" />
        <span className="time">{timeAgo(t.createdAt)}</span>
      </div>
      <div className="content">{t.content}</div>
    </article>
  );
}

export function ThreadView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSession();
  const [thread, setThread] = useState<ThreadWithReplies | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      setThread(await api.getThread(id));
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.reply(id, content.trim());
      setContent('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <p className="loading">⚠ {loadError}</p>;
  if (!thread) return <p className="loading">Loading thread…</p>;

  return (
    <>
      <Link to="/" className="back-link">← Back to feed</Link>

      <PostBlock t={thread} />

      <div className="divider" />

      <h2>Replies · {thread.replies.length}</h2>

      {user && (
        <div className="reply-compose">
          <form onSubmit={onSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              placeholder="Write a reply…"
            />
            {error && <div className="error">⚠ {error}</div>}
            <div className="reply-compose-footer">
              <button type="submit" disabled={busy || !content.trim()}>
                {busy ? 'Posting…' : 'Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {thread.replies.length === 0 && (
        <div className="empty-state">
          <span className="icon">💬</span>
          No replies yet.
        </div>
      )}

      <div className="replies-section">
        {thread.replies.map((r) => (
          <PostBlock key={r.id} t={r} />
        ))}
      </div>
    </>
  );
}
