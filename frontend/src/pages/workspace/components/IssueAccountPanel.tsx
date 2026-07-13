import type { PartyAlias } from '@canton-demo/shared/demo-money';
import { UserPlus } from 'lucide-react';

import { DecimalInput } from './DecimalInput';
import { PartySelect } from './PartySelect';
import { WorkspacePanel } from './WorkspacePanel';

type IssueAccountPanelProps = {
  owner: PartyAlias;
  initialBalance: string;
  onOwnerChange: (owner: PartyAlias) => void;
  onInitialBalanceChange: (initialBalance: string) => void;
  onIssue: () => void;
  disabled: boolean;
};

export function IssueAccountPanel({
  owner,
  initialBalance,
  onOwnerChange,
  onInitialBalanceChange,
  onIssue,
  disabled,
}: IssueAccountPanelProps) {
  return (
    <WorkspacePanel icon={<UserPlus size={18} />} title="Issue account">
      <div className="form-grid two-columns">
        <PartySelect label="Owner" value={owner} onChange={onOwnerChange} />
        <DecimalInput label="Initial balance" value={initialBalance} onChange={onInitialBalanceChange} />
      </div>

      <button type="button" onClick={onIssue} disabled={disabled}>
        <UserPlus size={16} />
        Issue BankAccount
      </button>
    </WorkspacePanel>
  );
}
