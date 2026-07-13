import type { ActorSessionDto } from '@canton-demo/shared/demo-money';
import { LogOut, UserRound } from 'lucide-react';

type WorkspaceHeaderProps = {
  session: ActorSessionDto;
  onLogout: () => void;
};

export function WorkspaceHeader({ session, onLogout }: WorkspaceHeaderProps) {
  return (
    <section className="topbar">
      <div>
        <p className="eyebrow">Canton demo</p>
        <h1>Money transfer workspace</h1>
      </div>

      <div className="identity">
        <UserRound size={18} />
        <div>
          <strong>{session.actor}</strong>
          <span>{session.actorParty}</span>
        </div>

        <button type="button" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </section>
  );
}
