import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider, useSession } from './session';
import { Feed } from './pages/Feed';
import { ThreadView } from './pages/ThreadView';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function Nav() {
  const { user, signOut } = useSession();
  return (
    <header className="nav">
      <Link to="/"><strong>goodshares</strong></Link>
      <nav>
        {user ? (
          <>
            <span>{user.username}</span>
            <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }}>sign out</a>
          </>
        ) : (
          <>
            <Link to="/login">login</Link>
            <Link to="/register">register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function App() {
  return (
    <SessionProvider>
      <div className="container">
        <Nav />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/threads/:id" element={<ThreadView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </SessionProvider>
  );
}
