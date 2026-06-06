import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clearSession, getStoredUser, saveSession } from './api';
import type { AuthResponse, SessionUser } from './api';

type SessionContextValue = {
  user: SessionUser | null;
  signIn: (res: AuthResponse) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getStoredUser());

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      signIn: (res) => {
        saveSession(res);
        setUser(res.user);
      },
      signOut: () => {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
