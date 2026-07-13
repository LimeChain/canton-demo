import type { PartyAlias } from '@canton-demo/shared/demo-money';
import { Search } from 'lucide-react';

import { PartySelect } from './PartySelect';
import { WorkspacePanel } from './WorkspacePanel';

type AccountQueryPanelProps = {
  owner: PartyAlias;
  onOwnerChange: (owner: PartyAlias) => void;
  onQuery: () => void;
  disabled: boolean;
};

export function AccountQueryPanel({ owner, onOwnerChange, onQuery, disabled }: AccountQueryPanelProps) {
  return (
    <WorkspacePanel icon={<Search size={18} />} title="Query account">
      <div className="form-grid two-columns">
        <PartySelect label="Owner" value={owner} onChange={onOwnerChange} />

        <button type="button" onClick={onQuery} disabled={disabled}>
          <Search size={16} />
          Query
        </button>
      </div>
    </WorkspacePanel>
  );
}
