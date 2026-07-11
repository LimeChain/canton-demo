import { PARTY_ALIAS_ALICE, PARTY_ALIAS_BOB, type PartyAlias } from '@canton-demo/shared/demo-money';

import type { ActionResult } from '../../components/result-panel/ResultPanel.types';
import { ApiError } from '../../services/api/client/client.errors';

export const blankResult: ActionResult = {
  ok: true,
  title: 'Ready',
  body: 'No backend action submitted yet.',
};

export function defaultReceiverFor(actor: PartyAlias): PartyAlias {
  if (actor === PARTY_ALIAS_ALICE) return PARTY_ALIAS_BOB;
  return PARTY_ALIAS_ALICE;
}

export function errorToResult(error: unknown, title: string): ActionResult {
  if (error instanceof ApiError) {
    return {
      ok: false,
      title,
      body: JSON.stringify(error.payload, null, 2),
    };
  }

  return {
    ok: false,
    title,
    body: error instanceof Error ? error.message : String(error),
  };
}
