import { createContext } from 'react';
import type Keycloak from 'keycloak-js';
import type { ActorSessionDto } from '@canton-demo/shared/demo-money';

export type AuthContextValue = {
  keycloak: Keycloak;
  session: ActorSessionDto | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
