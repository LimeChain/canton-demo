import { BadGatewayException, Injectable } from '@nestjs/common';
import { parseJsonText } from '@canton-demo/shared';
import type { PartyAlias } from '@canton-demo/shared/demo-money';

import { LEDGER_URL_BY_ACTOR } from '../../config/demo.config';

@Injectable()
export class LedgerClient {
  async submitAndWait(token: string, actor: PartyAlias, body: unknown): Promise<unknown> {
    const response = await fetch(`${LEDGER_URL_BY_ACTOR[actor]}/v2/commands/submit-and-wait`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BadGatewayException({
        message: 'Ledger API command failed',
        ledgerStatus: response.status,
        ledgerResponse: await this.readResponseBody(response),
      });
    }

    return this.readResponseBody(response);
  }

  private async readResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    return parseJsonText(text);
  }
}
