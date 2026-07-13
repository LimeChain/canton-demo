import type { PartyAlias } from '@canton-demo/shared/demo-money';
import { Banknote, Send } from 'lucide-react';

import { DecimalInput } from './DecimalInput';
import { PartySelect } from './PartySelect';
import { WorkspacePanel } from './WorkspacePanel';

type TransferRequestPanelProps = {
  receiver: PartyAlias;
  amount: string;
  onReceiverChange: (receiver: PartyAlias) => void;
  onAmountChange: (amount: string) => void;
  onRequest: () => void;
  disabled: boolean;
};

export function TransferRequestPanel({
  receiver,
  amount,
  onReceiverChange,
  onAmountChange,
  onRequest,
  disabled,
}: TransferRequestPanelProps) {
  return (
    <WorkspacePanel icon={<Send size={18} />} title="Send money">
      <div className="form-grid two-columns">
        <PartySelect label="Receiver" value={receiver} onChange={onReceiverChange} />
        <DecimalInput label="Amount" value={amount} onChange={onAmountChange} />
      </div>

      <button type="button" onClick={onRequest} disabled={disabled}>
        <Banknote size={16} />
        Request transfer
      </button>
    </WorkspacePanel>
  );
}
