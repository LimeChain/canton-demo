import type { PartyAlias } from '@canton-demo/shared/demo-money';

export const SERVER_CONFIG = {
  host: '0.0.0.0',
  port: 3000,
  corsOrigin: 'http://localhost:5173',
} as const;

export const KEYCLOAK_CONFIG = {
  issuer: 'http://localhost:8080/realms/canton-demo',
  jwksUrl: 'http://keycloak:8080/realms/canton-demo/protocol/openid-connect/certs',
} as const;

export const LEDGER_URL_BY_ACTOR: Record<PartyAlias, string> = {
  bank: 'http://participant-bank:5013',
  alice: 'http://participant-users:5013',
  bob: 'http://participant-users:5013',
  gosho: 'http://participant-users:5013',
  petyo: 'http://participant-observer:5013',
};

export const PQS_POSTGRES_CONFIG = {
  host: 'pqs-postgres',
  port: 5432,
  user: 'canton',
  password: 'canton',
} as const;

export const PARTIES_FILE = '/demo/parties.json';
