import {
  PARTY_ALIAS_ALICE,
  PARTY_ALIAS_BOB,
  type PartyAlias,
  type PendingTransferDto,
} from '@canton-demo/shared/demo-money';

import type { ActionResult } from '../../components/result-panel/ResultPanel.types';
import { ApiError } from '../../services/api/client/client.errors';

const PENDING_REFRESH_ATTEMPTS = 12;
const PENDING_REFRESH_DELAY_MS = 250;

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

export async function waitForPendingTransfersChange(
  loadPendingTransfers: () => Promise<PendingTransferDto[]>,
  previousTransfers: PendingTransferDto[],
): Promise<PendingTransferDto[]> {
  const previousFingerprint = pendingTransfersFingerprint(previousTransfers);
  let latestTransfers: PendingTransferDto[] = previousTransfers;

  for (let attempt = 0; attempt < PENDING_REFRESH_ATTEMPTS; attempt += 1) {
    latestTransfers = await loadPendingTransfers();

    if (pendingTransfersFingerprint(latestTransfers) !== previousFingerprint) {
      return latestTransfers;
    }

    await sleep(PENDING_REFRESH_DELAY_MS);
  }

  return latestTransfers;
}

function pendingTransfersFingerprint(pendingTransfers: PendingTransferDto[]): string {
  return JSON.stringify(pendingTransfers);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
