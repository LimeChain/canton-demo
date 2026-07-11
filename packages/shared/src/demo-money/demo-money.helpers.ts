import { DEMO_MONEY_ACCOUNTS_PATH } from './demo-money-api.constants';
import { PARTY_ALIASES } from './demo-money.constants';
import type { PartyAlias } from './demo-money.types';

export const isPartyAlias = (value: unknown): value is PartyAlias =>
  typeof value === 'string' && PARTY_ALIASES.includes(value as PartyAlias);

export const getDemoMoneyAccountPath = (owner: PartyAlias): string =>
  `${DEMO_MONEY_ACCOUNTS_PATH}/${owner}`;

export const formatDecimal = (value: string): string =>
  value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
