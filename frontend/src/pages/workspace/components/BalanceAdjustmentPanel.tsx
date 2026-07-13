import type { BalanceAdjustmentType, PartyAlias } from '@canton-demo/shared/demo-money';
import { CircleDollarSign } from 'lucide-react';

import { DecimalInput } from './DecimalInput';
import { PartySelect } from './PartySelect';
import { WorkspacePanel } from './WorkspacePanel';

type BalanceAdjustmentPanelProps = {
  owner: PartyAlias;
  adjustmentType: BalanceAdjustmentType;
  amount: string;
  onOwnerChange: (owner: PartyAlias) => void;
  onAdjustmentTypeChange: (adjustmentType: BalanceAdjustmentType) => void;
  onAmountChange: (amount: string) => void;
  onAdjust: () => void;
  disabled: boolean;
};

export function BalanceAdjustmentPanel({
  owner,
  adjustmentType,
  amount,
  onOwnerChange,
  onAdjustmentTypeChange,
  onAmountChange,
  onAdjust,
  disabled,
}: BalanceAdjustmentPanelProps) {
  return (
    <WorkspacePanel icon={<CircleDollarSign size={18} />} title="Adjust balance">
      <div className="form-grid">
        <PartySelect label="Owner" value={owner} onChange={onOwnerChange} />

        <label>
          Type
          <select
            value={adjustmentType}
            onChange={(event) => onAdjustmentTypeChange(event.target.value as BalanceAdjustmentType)}
          >
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
          </select>
        </label>

        <DecimalInput label="Amount" value={amount} onChange={onAmountChange} />
      </div>

      <button type="button" onClick={onAdjust} disabled={disabled}>
        <CircleDollarSign size={16} />
        Adjust balance
      </button>
    </WorkspacePanel>
  );
}
