import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const CONTRACTS_IMAGE = process.env.CONTRACTS_IMAGE ?? 'canton-demo-contracts:3.5.1';
export const CONTRACTS_DOCKERFILE = 'docker/Dockerfile.contracts';
export const CONTRACT_DAR = 'contracts/daml/.daml/dist/canton-demo-money-0.1.0.dar';
export const SCRIPT_DAR = 'scripts/daml/.daml/dist/canton-demo-money-scripts-0.1.0.dar';
export const GENERATED_BINDINGS_DIR = 'backend/src/generated/daml';
export const PARTIES_FILE = '.demo/parties.json';
export const STAMP_DIR = '.demo/stamps';

export const BUILD_STAMP = join(STAMP_DIR, 'build.sha256');
export const BINDINGS_STAMP = join(STAMP_DIR, 'bindings.sha256');
export const TEST_STAMP = join(STAMP_DIR, 'test.sha256');
export const DEPLOY_STAMP = join(STAMP_DIR, 'deploy.sha256');
export const INFRA_STAMP = join(STAMP_DIR, 'infra.id');
export const SHARED_STAMP = join(STAMP_DIR, 'shared.sha256');
export const CONTRACTS_IMAGE_STAMP = join(STAMP_DIR, 'contracts-image.sha256');

export const SERVICES = [
  'keycloak',
  'canton-synchronizer',
  'pqs-postgres',
  'participant-bank',
  'participant-users',
  'participant-observer',
  'backend',
  'frontend',
] as const;

export const PQS_SERVICES = ['pqs-bank', 'pqs-users', 'pqs-observer'] as const;
export const PQS_DATABASES = ['pqs_bank', 'pqs_users', 'pqs_observer'] as const;
export const JSON_API_URLS = ['http://localhost:5013', 'http://localhost:5023', 'http://localhost:5033'] as const;
export const PARTICIPANT_SERVICES = ['participant-bank', 'participant-users', 'participant-observer'] as const;

export const KEYCLOAK_PUBLIC_URL = process.env.KEYCLOAK_PUBLIC_URL ?? 'http://localhost:8080';
export const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM ?? 'canton-demo';
export const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID ?? 'canton-demo-admin';
export const KEYCLOAK_ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET ?? 'canton-demo-admin-secret';
export const KEYCLOAK_ADMIN_SCOPE = process.env.KEYCLOAK_ADMIN_SCOPE ?? 'canton_demo_admin';
export const KEYCLOAK_PQS_CLIENT_ID = process.env.KEYCLOAK_PQS_CLIENT_ID ?? 'canton-demo-pqs';
export const KEYCLOAK_PQS_CLIENT_SECRET = process.env.KEYCLOAK_PQS_CLIENT_SECRET ?? 'canton-demo-pqs-secret';
export const KEYCLOAK_PQS_SCOPE = process.env.KEYCLOAK_PQS_SCOPE ?? 'daml_ledger_api';
