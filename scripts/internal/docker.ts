import { createHash } from 'node:crypto';

import {
  CONTRACTS_IMAGE,
  PARTICIPANT_SERVICES,
  PQS_DATABASES,
  PQS_SERVICES,
  ROOT_DIR,
  SERVICES,
} from './config.js';
import { run, sleep, tryRun, type RunOptions } from './process.js';
import { log } from './output.js';

type PqsService = (typeof PQS_SERVICES)[number];
type PqsDatabase = (typeof PQS_DATABASES)[number];

const PQS_DATABASE_BY_SERVICE: Record<PqsService, PqsDatabase> = {
  'pqs-bank': 'pqs_bank',
  'pqs-users': 'pqs_users',
  'pqs-observer': 'pqs_observer',
};

export function compose(args: string[]): string {
  return run('docker', ['compose', ...args], { capture: true });
}

export function composeInherit(args: string[]): void {
  run('docker', ['compose', ...args]);
}

export function resetDemoInfra(): void {
  composeInherit(['down', '--volumes', '--remove-orphans']);
}

export function requireDocker(): void {
  if (!tryRun('docker', ['--version']).ok) {
    throw new Error('Docker is not installed or is not available in PATH.');
  }

  if (!tryRun('docker', ['info']).ok) {
    throw new Error('Docker daemon is not running. Start Docker and rerun: npm run start');
  }
}

export function infraReady(): boolean {
  return SERVICES.every((service) => serviceStatus(service) === 'ready');
}

export async function waitForInfra(): Promise<void> {
  const deadline = Date.now() + 240_000;

  while (Date.now() < deadline) {
    if (infraReady()) return;
    await sleep(4_000);
  }

  throw new Error('Canton demo infra did not become healthy within 240 seconds.');
}

export function currentInfraId(): string {
  const hash = createHash('sha256');
  for (const service of ['keycloak', 'canton-synchronizer', 'participant-bank', 'participant-users', 'participant-observer', 'pqs-postgres']) {
    hash.update(`${service}=${serviceId(service)}\n`);
  }

  return hash.digest('hex');
}

export function contractsNetwork(): string {
  const network = tryRun('docker', [
    'inspect',
    'canton-demo-pqs-postgres',
    '--format',
    '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}',
  ]).stdout.trim().split('\n')[0] ?? '';

  if (network.length === 0) {
    throw new Error('Canton demo infra is not running. Run: npm run start:infra');
  }

  return network;
}

export function runWorkspace(args: string[], options: RunOptions = {}): string {
  return run('docker', [
    'run',
    '--rm',
    ...dockerUserArgs(),
    '-e',
    'HOME=/tmp',
    '-v',
    `${ROOT_DIR}:/workspace`,
    '-w',
    '/workspace',
    CONTRACTS_IMAGE,
    ...args,
  ], options);
}

export function runContracts(args: string[], options: RunOptions = {}): string {
  return run('docker', [
    'run',
    '--rm',
    '-i',
    '--network',
    contractsNetwork(),
    ...dockerUserArgs(),
    '-e',
    'HOME=/tmp',
    '-v',
    `${ROOT_DIR}:/workspace`,
    '-w',
    '/workspace',
    CONTRACTS_IMAGE,
    ...args,
  ], options);
}

export function tryRunContracts(args: string[]): { ok: boolean; stdout: string } {
  return tryRun('docker', [
    'run',
    '--rm',
    '-i',
    '--network',
    contractsNetwork(),
    ...dockerUserArgs(),
    '-e',
    'HOME=/tmp',
    '-v',
    `${ROOT_DIR}:/workspace`,
    '-w',
    '/workspace',
    CONTRACTS_IMAGE,
    ...args,
  ]);
}

export function resetPqsDatabases(databases: readonly PqsDatabase[] = PQS_DATABASES): void {
  const services = pqsServicesForDatabases(databases);

  log(`Rebuilding PQS read-model database${databases.length === 1 ? '' : 's'}: ${databases.join(', ')}...`);
  tryRun('docker', ['compose', 'stop', ...services]);

  for (const database of databases) {
    run('docker', [
      'exec',
      'canton-demo-pqs-postgres',
      'psql',
      '-U',
      'canton',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `DROP DATABASE IF EXISTS ${database} WITH (FORCE);`,
      '-c',
      `CREATE DATABASE ${database};`,
    ], { capture: true });
  }

  compose(['up', '-d', ...services]);
}

export function restartPqsServices(): void {
  compose(['restart', ...PQS_SERVICES]);
}

export async function waitForPqs(): Promise<void> {
  let deadline = Date.now() + 180_000;
  let resetAttempted = false;

  while (Date.now() < deadline) {
    const servicesReady = PQS_SERVICES.every((service) => serviceStatus(service) === 'ready');
    const databasesReady = PQS_DATABASES.every((database) => pqsDatabaseReady(database));

    if (servicesReady && databasesReady) return;

    const mismatchedServices = pqsOffsetMismatchServices();
    if (!resetAttempted && mismatchedServices.length > 0) {
      resetAttempted = true;
      resetPqsDatabases(mismatchedServices.map((service) => PQS_DATABASE_BY_SERVICE[service]));
      deadline = Date.now() + 180_000;
    }

    await sleep(4_000);
  }

  throw new Error('PQS services did not become healthy within 180 seconds.');
}

export async function waitForParticipantPorts(): Promise<void> {
  const deadline = Date.now() + 180_000;
  const services = PARTICIPANT_SERVICES.join(' ');

  while (Date.now() < deadline) {
    const result = tryRunContracts(['bash', '-lc', `
set -euo pipefail
token="$(cat /workspace/.demo/admin.token)"
for service in ${services}; do
  timeout 2 bash -c "</dev/tcp/$service/5011"
  timeout 2 bash -c "</dev/tcp/$service/5012"
  curl -fsS --connect-timeout 2 --max-time 4 -H "authorization: Bearer $token" "http://$service:5013/v2/packages" >/dev/null
done
`]);

    if (result.ok) return;
    await sleep(3_000);
  }

  throw new Error('Participants are not reachable from the Daml tooling container.');
}

function serviceId(service: string): string {
  return tryRun('docker', ['compose', 'ps', '-q', service]).stdout.trim();
}

function serviceStatus(service: string): string {
  const id = serviceId(service);
  if (id.length === 0) return 'missing';

  const running = tryRun('docker', ['inspect', '--format', '{{.State.Running}}', id]).stdout.trim();
  if (running !== 'true') return 'stopped';

  const health = tryRun('docker', [
    'inspect',
    '--format',
    '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}',
    id,
  ]).stdout.trim();

  return health === 'healthy' || health === 'none' ? 'ready' : health || 'unknown';
}

function pqsOffsetMismatchServices(): PqsService[] {
  return PQS_SERVICES.filter((service) => {
    if (serviceStatus(service) === 'ready') return false;

    const logs = tryRun('docker', ['logs', '--tail', '500', `canton-demo-${service}`]).stdout;
    return logs.includes('Cannot prepend to existing datastore');
  });
}

function pqsDatabaseReady(database: string): boolean {
  const query = "select (select count(*) from active('canton-demo-money:DemoMoney:BankAccount')) >= 2;";
  const result = tryRun('docker', [
    'exec',
    'canton-demo-pqs-postgres',
    'psql',
    '-U',
    'canton',
    '-d',
    database,
    '-Atc',
    query,
  ]).stdout.trim();

  return result === 't';
}

function dockerUserArgs(): string[] {
  return typeof process.getuid === 'function' && typeof process.getgid === 'function'
    ? ['--user', `${process.getuid()}:${process.getgid()}`]
    : [];
}

function pqsServicesForDatabases(databases: readonly PqsDatabase[]): PqsService[] {
  return PQS_SERVICES.filter((service) => databases.includes(PQS_DATABASE_BY_SERVICE[service]));
}
