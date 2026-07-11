import {
  DEMO_MONEY_ADJUST_BALANCE_PATH,
  DEMO_MONEY_ISSUE_ACCOUNT_PATH,
  DEMO_MONEY_ME_PATH,
  DEMO_MONEY_PENDING_TRANSFERS_PATH,
  DEMO_MONEY_PROCESS_TRANSFERS_PATH,
  DEMO_MONEY_REQUEST_TRANSFER_PATH,
  getDemoMoneyAccountPath,
  type AccountDto,
  type ActorSessionDto,
  type BalanceAdjustmentType,
  type PartyAlias,
  type PendingTransferDto,
} from '@canton-demo/shared/demo-money';

import { request } from '../client/client';

export function getSession(): Promise<ActorSessionDto> {
  return request(DEMO_MONEY_ME_PATH);
}

export function queryAccount(owner: PartyAlias): Promise<AccountDto> {
  return request(getDemoMoneyAccountPath(owner));
}

export function listPendingTransfers(): Promise<PendingTransferDto[]> {
  return request(DEMO_MONEY_PENDING_TRANSFERS_PATH);
}

export function requestTransfer(receiver: PartyAlias, amount: string): Promise<unknown> {
  return request(DEMO_MONEY_REQUEST_TRANSFER_PATH, {
    method: 'POST',
    body: { receiver, amount },
  });
}

export function issueAccount(owner: PartyAlias, initialBalance: string): Promise<unknown> {
  return request(DEMO_MONEY_ISSUE_ACCOUNT_PATH, {
    method: 'POST',
    body: { owner, initialBalance },
  });
}

export function adjustBalance(
  owner: PartyAlias,
  adjustmentType: BalanceAdjustmentType,
  amount: string,
): Promise<unknown> {
  return request(DEMO_MONEY_ADJUST_BALANCE_PATH, {
    method: 'POST',
    body: { owner, adjustmentType, amount },
  });
}

export function processPendingTransfers(): Promise<unknown> {
  return request(DEMO_MONEY_PROCESS_TRANSFERS_PATH, {
    method: 'POST',
    body: {},
  });
}
