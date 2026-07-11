import { Workspace } from './pages/workspace/Workspace';
import { Providers } from './providers';

export function App() {
  return (
    <Providers>
      <Workspace />
    </Providers>
  );
}
