import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { PartyAlias } from '@canton-demo/shared/demo-money';
import { Pool } from 'pg';

import { PQS_POSTGRES_CONFIG } from '../../config/demo.config';

export type PqsContract<TPayload> = {
  contractId: string;
  payload: TPayload;
};

type PqsDbName = 'pqs_bank' | 'pqs_users' | 'pqs_observer';

const dbByActor: Record<PartyAlias, PqsDbName> = {
  bank: 'pqs_bank',
  alice: 'pqs_users',
  bob: 'pqs_users',
  gosho: 'pqs_users',
  petyo: 'pqs_observer',
};

@Injectable()
export class PqsRepository implements OnModuleDestroy {
  private readonly pools = new Map<PqsDbName, Pool>();

  async findActiveByTemplate<TPayload>(
    actor: PartyAlias,
    actorParty: string,
    templateFqn: string,
  ): Promise<PqsContract<TPayload>[]> {
    const pool = this.poolFor(actor);
    const result = await pool.query<{ contract_id: string; payload: TPayload }>(
      `
        select contract_id, payload
        from active($1) a
        where stakeholders(a.*) @> array[$2]::text[]
        order by created_at_offset, created_at_ix
      `,
      [templateFqn, actorParty],
    );

    return result.rows.map((row) => ({
      contractId: row.contract_id,
      payload: row.payload,
    }));
  }

  async findActiveByContractKey<TPayload>(
    actor: PartyAlias,
    actorParty: string,
    templateFqn: string,
    contractKey: unknown,
  ): Promise<PqsContract<TPayload> | undefined> {
    const pool = this.poolFor(actor);
    const result = await pool.query<{ contract_id: string; payload: TPayload }>(
      `
        select contract_id, payload
        from active($1) a
        where stakeholders(a.*) @> array[$2]::text[]
          and contract_key = $3::jsonb
        order by created_at_offset desc, created_at_ix desc
        limit 1
      `,
      [templateFqn, actorParty, JSON.stringify(contractKey)],
    );

    const row = result.rows[0];
    return row ? { contractId: row.contract_id, payload: row.payload } : undefined;
  }

  async onModuleDestroy() {
    await Promise.all([...this.pools.values()].map((pool) => pool.end()));
  }

  private poolFor(actor: PartyAlias): Pool {
    const db = dbByActor[actor];
    const existing = this.pools.get(db);
    if (existing) return existing;

    const pool = new Pool({
      host: PQS_POSTGRES_CONFIG.host,
      port: PQS_POSTGRES_CONFIG.port,
      user: PQS_POSTGRES_CONFIG.user,
      password: PQS_POSTGRES_CONFIG.password,
      database: db,
      max: 5,
    });

    this.pools.set(db, pool);
    return pool;
  }
}
