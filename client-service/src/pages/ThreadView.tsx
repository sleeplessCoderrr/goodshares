import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Thread, ThreadWithReplies } from '../api';
import { useSession } from '../session';

function PostBlock({ t }: { t: Thread }) {
  return (
    <article className="post">
      <div className="meta">
        <strong>{t.author.displayName}</strong> @{t.author.username} ·{' '}
        {new Date(t.createdAt).toLocaleString()}
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

  async function load() {
    if (!id) return;
    try {
      setThread(await api.getThread(id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

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

  if (!thread) return <p>{error ?? 'Loading...'}</p>;

  return (
    <>
      <p><Link to="/">← back</Link></p>
      <PostBlock t={thread} />
      <h2>Replies</h2>
      {user && (
        <form onSubmit={onSubmit}>
          <label>
            reply
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={busy || !content.trim()}>Reply</button>
        </form>
      )}
      {thread.replies.length === 0 && <p>No replies yet.</p>}
      {thread.replies.map((r) => (
        <PostBlock key={r.id} t={r} />
      ))}
    </>
  );
}
