import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  PARTY_ALIASES,
  type DemoParties,
  type PartyAlias,
} from '@canton-demo/shared/demo-money';
import { readFile } from 'node:fs/promises';

import { PARTIES_FILE } from '../../config/demo.config';

@Injectable()
export class PartiesService {
  private parties?: DemoParties;

  async getAll(): Promise<DemoParties> {
    if (this.parties) {
      return this.parties;
    }

    try {
      const raw = await readFile(PARTIES_FILE, 'utf8');
      const parties = JSON.parse(raw) as Partial<DemoParties>;

      for (const alias of PARTY_ALIASES) {
        if (typeof parties[alias] !== 'string') {
          throw new Error(`missing party ${alias}`);
        }
      }

      this.parties = parties as DemoParties;
      return this.parties;
    } catch (error) {
      throw new ServiceUnavailableException(`demo parties are not deployed: ${String(error)}`);
    }
  }

  async get(alias: PartyAlias): Promise<string> {
    const parties = await this.getAll();
    return parties[alias];
  }

  async actorContext(actor: PartyAlias) {
    const parties = await this.getAll();
    return {
      actor,
      actorParty: parties[actor],
      parties,
    };
  }
}
