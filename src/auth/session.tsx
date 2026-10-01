import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { TermsGate } from '../components/TermsGate';
import { TERMS_VERSION } from '../legal/terms';

export type Role = 'employee' | 'psychologist';

export interface Session {
  id: number;
  role: Role;
  name: string;
  email: string;
  /** Employees: profile photo as a data URL, or null */
  avatar?: string | null;
  /** Employees: the company paying for the plan */
  companyName?: string;
  /** Psychologists: 'pending' until the professional registration is checked */
  status?: 'pending' | 'active';
  /** The account accepted the current version of the terms */
  termsAccepted: boolean;
}

/** What the person ticked: the terms and, for employees, the health-data consent */
interface AcceptanceInput {
  terms: boolean;
  healthData: boolean;
}

/** Demo accounts offered on the login page */
export type DemoAccount = 'employee' | 'new-employee' | 'psychologist';

export type RegisterInput = (
  | { role: 'employee'; name: string; email: string; password: string; companyCode: string }
  | { role: 'psychologist'; name: string; email: string; password: string; reg: string; title: string }
) & { acceptance: AcceptanceInput };

const acceptancePayload = (acceptance: AcceptanceInput) => ({
  acceptedTerms: acceptance.terms,
  healthDataConsent: acceptance.healthData,
  termsVersion: TERMS_VERSION,
});

interface SessionContextValue {
  session: Session | null;
  /** False while the stored login is being checked with the API */
  ready: boolean;
  /** True right after signing out, so the guard sends the visitor home instead of to the login page */
  signedOut: boolean;
  login: (email: string, password: string) => Promise<Session>;
  register: (input: RegisterInput) => Promise<Session>;
  /** Enters a demo account without a password */
  loginDemo: (account: DemoAccount) => Promise<Session>;
  /** Records the acceptance of the terms for the signed-in account */
  acceptTerms: (acceptance: AcceptanceInput) => Promise<void>;
  /** Saves the employee's profile photo (a data URL), or removes it with null */
  updateAvatar: (image: string | null) => Promise<void>;
  logout: () => void;
}

export const HOME_BY_ROLE: Record<Role, string> = {
  employee: '/app/inicio',
  psychologist: '/psi/inicio',
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(() => getToken() === null);
  const [signedOut, setSignedOut] = useState(false);

  // Restore the login kept in this browser
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    api<{ user: Session }>('GET', '/auth/me')
      .then(({ user }) => {
        if (!cancelled) setSession(user);
      })
      .catch(() => {
        // Expired or revoked token: start signed out. Other failures keep the token for a later retry.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The API rejected the token in the middle of a session
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setSession(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const start = useCallback(({ token, user }: { token: string; user: Session }) => {
    setToken(token);
    setSession(user);
    setSignedOut(false);
    return user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      start(await api<{ token: string; user: Session }>('POST', '/auth/login', { email, password })),
    [start]
  );

  const register = useCallback(
    async ({ acceptance, ...input }: RegisterInput) =>
      start(
        await api<{ token: string; user: Session }>('POST', '/auth/register', {
          ...input,
          ...acceptancePayload(acceptance),
        })
      ),
    [start]
  );

  const acceptTerms = useCallback(async (acceptance: AcceptanceInput) => {
    const { user } = await api<{ user: Session }>('POST', '/auth/terms', acceptancePayload(acceptance));
    setSession(user);
  }, []);

  const loginDemo = useCallback(
    async (account: DemoAccount) =>
      start(await api<{ token: string; user: Session }>('POST', '/auth/demo', { account })),
    [start]
  );

  const updateAvatar = useCallback(async (image: string | null) => {
    const { user } = await api<{ user: Session }>('PUT', '/auth/avatar', { image });
    setSession(user);
  }, []);

  const logout = useCallback(() => {
    // Revoke on the server in the background; the local session ends either way
    api('POST', '/auth/logout').catch(() => {});
    setToken(null);
    setSession(null);
    setSignedOut(true);
  }, []);

  return (
    <SessionContext.Provider value={{ session, ready, signedOut, login, register, loginDemo, acceptTerms, updateAvatar, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
};

/** Sends visitors to the login page and signed-in users of another role to their own area */
export const RequireRole: React.FC<{ role: Role; children: React.ReactNode }> = ({ role, children }) => {
  const { session, ready, signedOut } = useSession();
  if (!ready) return <LoadingScreen />;
  if (!session && signedOut) return <Navigate to="/" replace />;
  if (!session) {
    return <Navigate to={`/entrar?perfil=${role === 'psychologist' ? 'psicologo' : 'funcionario'}`} replace />;
  }
  if (session.role !== role) return <Navigate to={HOME_BY_ROLE[session.role]} replace />;
  // Nothing of the app is shown before the current terms are accepted
  if (!session.termsAccepted) return <TermsGate />;
  return <>{children}</>;
};
