import { Banknote, CircleDollarSign, LogOut, Play, Search, Send, UserPlus, UserRound } from 'lucide-react';
import {
  PARTY_ALIAS_ALICE,
  PARTY_ALIAS_BOB,
  PARTY_ALIAS_GOSHO,
  PARTY_ALIASES,
  formatDecimal,
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
          <button type="button" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </section>

      <section className="workspace">
        <div className="panel">
          <div className="panel-title">
            <Search size={18} />
            <h2>Query account</h2>
          </div>

          <div className="form-grid two-columns">
            <label>
              Owner
              <select value={queryOwner} onChange={(event) => setQueryOwner(event.target.value as PartyAlias)}>
                {PARTY_ALIASES.map((alias) => (
                  <option key={alias} value={alias}>
                    {alias}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={querySelectedAccount} disabled={busy}>
              <Search size={16} />
              Query
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <Send size={18} />
            <h2>Send money</h2>
          </div>

          <div className="form-grid two-columns">
            <label>
              Receiver
              <select value={receiver} onChange={(event) => setReceiver(event.target.value as PartyAlias)}>
                {PARTY_ALIASES.map((alias) => (
                  <option key={alias} value={alias}>
                    {alias}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Amount
              <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
            </label>
          </div>

          <button type="button" onClick={submitTransferRequest} disabled={busy}>
            <Banknote size={16} />
            Request transfer
          </button>
        </div>

        <div className="panel">
          <div className="panel-title">
            <UserPlus size={18} />
            <h2>Issue account</h2>
          </div>

          <div className="form-grid two-columns">
            <label>
              Owner
              <select value={issueOwner} onChange={(event) => setIssueOwner(event.target.value as PartyAlias)}>
                {PARTY_ALIASES.map((alias) => (
                  <option key={alias} value={alias}>
                    {alias}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Initial balance
              <input
                value={issueInitialBalance}
                onChange={(event) => setIssueInitialBalance(event.target.value)}
                inputMode="decimal"
              />
            </label>
          </div>

          <button type="button" onClick={submitIssueAccount} disabled={busy}>
            <UserPlus size={16} />
            Issue BankAccount
          </button>
        </div>

        <div className="panel">
          <div className="panel-title">
            <CircleDollarSign size={18} />
            <h2>Adjust balance</h2>
          </div>

          <div className="form-grid">
            <label>
              Owner
              <select value={adjustOwner} onChange={(event) => setAdjustOwner(event.target.value as PartyAlias)}>
                {PARTY_ALIASES.map((alias) => (
                  <option key={alias} value={alias}>
                    {alias}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Type
              <select
                value={adjustmentType}
                onChange={(event) => setAdjustmentType(event.target.value as BalanceAdjustmentType)}
              >
                <option value="Credit">Credit</option>
                <option value="Debit">Debit</option>
              </select>
            </label>

            <label>
              Amount
              <input value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} inputMode="decimal" />
            </label>
          </div>

          <button type="button" onClick={submitBalanceAdjustment} disabled={busy}>
            <CircleDollarSign size={16} />
            Adjust balance
          </button>
        </div>

        <div className="panel instructions-panel">
          <div className="panel-title">
            <Play size={18} />
            <h2>Authorize transfers</h2>
          </div>

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

          <button type="button" onClick={authorizePendingTransfers} disabled={busy}>
            <Play size={16} />
            Process pending
          </button>
        </div>

        <ResultPanel result={result} />
      </section>
    </main>
  );
}
