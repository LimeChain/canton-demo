import { formatDecimal, type PendingTransferDto } from '@canton-demo/shared/demo-money';
import { Play } from 'lucide-react';

import { WorkspacePanel } from './WorkspacePanel';

type PendingTransfersPanelProps = {
  instructions: PendingTransferDto[];
  onAuthorize: () => void;
  disabled: boolean;
};

export function PendingTransfersPanel({ instructions, onAuthorize, disabled }: PendingTransfersPanelProps) {
  return (
    <WorkspacePanel className="instructions-panel" icon={<Play size={18} />} title="Authorize transfers">
      {instructions.length === 0 ? (
        <p className="empty">No Pending Transfer Instructions</p>
      ) : (
        <div className="table">
          {instructions.map((instruction, index) => (
            <div className="row" key={`${instruction.senderParty}-${instruction.receiverParty}-${instruction.amount}-${index}`}>
              <span>
                {instruction.sender} to {instruction.receiver}
              </span>
              <strong>{formatDecimal(instruction.amount)}</strong>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={onAuthorize} disabled={disabled}>
        <Play size={16} />
        Process pending
      </button>
    </WorkspacePanel>
  );
}
