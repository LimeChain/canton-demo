import { AuthProvider } from './auth/AuthProvider';
import type { ProvidersProps } from './Providers.types';

export function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
