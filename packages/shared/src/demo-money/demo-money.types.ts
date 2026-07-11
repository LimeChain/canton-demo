import type { PARTY_ALIASES } from './demo-money.constants';

export type PartyAlias = (typeof PARTY_ALIASES)[number];

export type DemoParties = Record<PartyAlias, string>;

export type ActorSessionDto = {
  actor: PartyAlias;
  actorParty: string;
  parties: DemoParties;
};

export type AccountDto = {
  contractId: string;
  owner: PartyAlias | string;
  ownerParty: string;
  balance: string;
};

export type PendingTransferDto = {
  contractId: string;
  sender: PartyAlias | string;
  senderParty: string;
  receiver: PartyAlias | string;
  receiverParty: string;
  amount: string;
};

export type RequestTransferRequest = {
  receiver: PartyAlias;
  amount: string;
};

export type IssueAccountRequest = {
  owner: PartyAlias;
  initialBalance: string;
};

export type BalanceAdjustmentType = 'Credit' | 'Debit';

export type AdjustBalanceRequest = {
  owner: PartyAlias;
  adjustmentType: BalanceAdjustmentType;
  amount: string;
};

export type ProcessPendingTransfersResponse = {
  processed: number;
  outputs: unknown[];
};
