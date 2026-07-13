import { parseJsonText } from '../../packages/shared/src/json/json.helpers.js';

import {
  KEYCLOAK_ADMIN_CLIENT_ID,
  KEYCLOAK_ADMIN_CLIENT_SECRET,
  KEYCLOAK_ADMIN_SCOPE,
  KEYCLOAK_PQS_CLIENT_ID,
  KEYCLOAK_PQS_CLIENT_SECRET,
  KEYCLOAK_PQS_SCOPE,
  KEYCLOAK_PUBLIC_URL,
  KEYCLOAK_REALM,
} from './config.js';
import { ensureDir, writeText } from './files.js';
import { run } from './process.js';

export function fetchAdminToken(): string {
  return fetchClientToken(KEYCLOAK_ADMIN_CLIENT_ID, KEYCLOAK_ADMIN_CLIENT_SECRET, KEYCLOAK_ADMIN_SCOPE);
}

export function fetchPqsToken(): string {
  return fetchClientToken(KEYCLOAK_PQS_CLIENT_ID, KEYCLOAK_PQS_CLIENT_SECRET, KEYCLOAK_PQS_SCOPE);
}

export function writeAuthFiles(): string {
  ensureDir('.demo');
  const token = fetchAdminToken();
  writeText('.demo/admin.token', token);
  writeText('.demo/canton-console-auth.conf', cantonConsoleAuthConfig(token));

  return token;
}

export function jwtSub(token: string): string {
  const parts = token.split('.');
  if (parts.length < 2) return '';

  const parsed = parseJsonText(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (!isObject(parsed) || typeof parsed.sub !== 'string') return '';

  return parsed.sub;
}

function fetchClientToken(clientId: string, clientSecret: string, scope: string): string {
  const tokenUrl = `${KEYCLOAK_PUBLIC_URL.replace(/\/$/, '')}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({ grant_type: 'client_credentials', scope });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = run('curl', [
    '-fsS',
    '--connect-timeout',
    '10',
    '--max-time',
    '30',
    '-H',
    `authorization: Basic ${auth}`,
    '-H',
    'content-type: application/x-www-form-urlencoded',
    '-d',
    body.toString(),
    tokenUrl,
  ], { capture: true });

  const parsed = parseJsonText(response);
  if (!isObject(parsed) || typeof parsed.access_token !== 'string') {
    throw new Error('Keycloak did not return an access_token.');
  }

  return parsed.access_token;
}

function cantonConsoleAuthConfig(token: string): string {
  return `canton {
  remote-participants {
    bank {
      ledger-api {
        address = "participant-bank"
        port = 5011
      }
      admin-api {
        address = "participant-bank"
        port = 5012
      }
      token = "${token}"
    }

    users {
      ledger-api {
        address = "participant-users"
        port = 5011
      }
      admin-api {
        address = "participant-users"
        port = 5012
      }
      token = "${token}"
    }

    observer {
      ledger-api {
        address = "participant-observer"
        port = 5011
      }
      admin-api {
        address = "participant-observer"
        port = 5012
      }
      token = "${token}"
    }
  }
}
`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
