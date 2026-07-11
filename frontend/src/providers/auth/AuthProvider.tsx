import type { ActorSessionDto } from '@canton-demo/shared/demo-money';
import { useEffect, useMemo, useState } from 'react';

import { getSession } from '../../services/api/demo-money/demoMoneyApi';
import { AuthContext } from './AuthProvider.context';
import type { AuthProviderProps } from './AuthProvider.types';
import { ensureAuthenticated, keycloak } from './keycloak';

export function AuthProvider({ children }: AuthProviderProps) {
  // STATE
  const [session, setSession] = useState<ActorSessionDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // METHODS
  async function refreshSession() {
    setSession(await getSession());
  }

  async function logout() {
    await keycloak.logout({ redirectUri: window.location.origin });
  }

  // EFFECTS
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await ensureAuthenticated();
        const loadedSession = await getSession();

        if (!cancelled) {
          setSession(loadedSession);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : String(caught));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // RETURN
  const value = useMemo(
    () => ({
      keycloak,
      session,
      isLoading,
      error,
      logout,
      refreshSession,
    }),
    [session, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
