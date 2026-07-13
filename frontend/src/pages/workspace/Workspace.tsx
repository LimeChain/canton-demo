import {
  PARTY_ALIAS_ALICE,
  PARTY_ALIAS_BOB,
  PARTY_ALIAS_GOSHO,
  type BalanceAdjustmentType,
  type PartyAlias,
  type PendingTransferDto,
} from '@canton-demo/shared/demo-money';
import { useEffect, useState } from 'react';

import { ResultPanel } from '../../components/result-panel/ResultPanel';
import type { ActionResult } from '../../components/result-panel/ResultPanel.types';
import { useAuth } from '../../providers/auth/useAuth';
import {
  adjustBalance,
  issueAccount,
  listPendingTransfers,
  processPendingTransfers,
  queryAccount,
  requestTransfer,
} from '../../services/api/demo-money/demoMoneyApi';
import {
  AccountQueryPanel,
  BalanceAdjustmentPanel,
  IssueAccountPanel,
  PendingTransfersPanel,
  TransferRequestPanel,
  WorkspaceHeader,
} from './components';
import { blankResult, defaultReceiverFor, errorToResult } from './Workspace.helpers';
import type { ActionTitles } from './Workspace.types';

export function Workspace() {
  // STATE
  const { session, isLoading, error, logout } = useAuth();
  const [receiver, setReceiver] = useState<PartyAlias>(PARTY_ALIAS_BOB);
  const [queryOwner, setQueryOwner] = useState<PartyAlias>(PARTY_ALIAS_ALICE);
  const [issueOwner, setIssueOwner] = useState<PartyAlias>(PARTY_ALIAS_GOSHO);
  const [issueInitialBalance, setIssueInitialBalance] = useState<string>('0.0');
  const [adjustOwner, setAdjustOwner] = useState<PartyAlias>(PARTY_ALIAS_ALICE);
  const [adjustmentType, setAdjustmentType] = useState<BalanceAdjustmentType>('Credit');
  const [adjustAmount, setAdjustAmount] = useState<string>('10.0');
  const [amount, setAmount] = useState<string>('10.0');
  const [instructions, setInstructions] = useState<PendingTransferDto[]>([]);
  const [result, setResult] = useState<ActionResult>(blankResult);
  const [busy, setBusy] = useState<boolean>(false);

  // HELPERS
  async function refreshPendingTransfers() {
    setInstructions(await listPendingTransfers());
  }

  async function querySelectedAccount() {
    await runAction(
      { success: 'Account query completed', failure: 'Account query failed' },
      () => queryAccount(queryOwner),
    );
  }

  async function submitTransferRequest() {
    await runAction({ success: 'Transfer request submitted', failure: 'Transfer request failed' }, () =>
      requestTransfer(receiver, amount),
    );
  }

  async function submitIssueAccount() {
    await runAction({ success: 'BankAccount issued', failure: 'BankAccount issuance failed' }, () =>
      issueAccount(issueOwner, issueInitialBalance),
    );
  }

  async function submitBalanceAdjustment() {
    await runAction({ success: 'Balance adjustment posted', failure: 'Balance adjustment failed' }, () =>
      adjustBalance(adjustOwner, adjustmentType, adjustAmount),
    );
  }

  async function authorizePendingTransfers() {
    await runAction(
      { success: 'Pending transfer processing attempted', failure: 'Pending transfer processing failed' },
      () => processPendingTransfers(),
    );
  }

  async function runAction(titles: ActionTitles, action: () => Promise<unknown>) {
    setBusy(true);
    try {
      const response = await action();
      setResult({ ok: true, title: titles.success, body: JSON.stringify(response, null, 2) });
      setInstructions(await listPendingTransfers());
    } catch (caught) {
      setResult(errorToResult(caught, titles.failure));
    } finally {
      setBusy(false);
    }
  }

  // EFFECTS
  useEffect(() => {
    if (!session) return;

    setQueryOwner(session.actor);
    setReceiver(defaultReceiverFor(session.actor));
    void refreshPendingTransfers();
  }, [session]);

  // RENDER
  if (isLoading) {
    return null;
  }

  if (error || !session) {
    return error ?? 'Missing authenticated demo session';
  }

  return (
    <main className="app-shell">
      <WorkspaceHeader session={session} onLogout={logout} />

      <section className="workspace">
        <AccountQueryPanel
          owner={queryOwner}
          onOwnerChange={setQueryOwner}
          onQuery={querySelectedAccount}
          disabled={busy}
        />

        <TransferRequestPanel
          receiver={receiver}
          amount={amount}
          onReceiverChange={setReceiver}
          onAmountChange={setAmount}
          onRequest={submitTransferRequest}
          disabled={busy}
        />

        <IssueAccountPanel
          owner={issueOwner}
          initialBalance={issueInitialBalance}
          onOwnerChange={setIssueOwner}
          onInitialBalanceChange={setIssueInitialBalance}
          onIssue={submitIssueAccount}
          disabled={busy}
        />

        <BalanceAdjustmentPanel
          owner={adjustOwner}
          adjustmentType={adjustmentType}
          amount={adjustAmount}
          onOwnerChange={setAdjustOwner}
          onAdjustmentTypeChange={setAdjustmentType}
          onAmountChange={setAdjustAmount}
          onAdjust={submitBalanceAdjustment}
          disabled={busy}
        />

        <PendingTransfersPanel instructions={instructions} onAuthorize={authorizePendingTransfers} disabled={busy} />
      </section>

      <ResultPanel result={result} />
    </main>
  );
}
