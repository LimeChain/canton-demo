import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { PARTY_ALIASES, type DemoParties } from '../../packages/shared/src/demo-money/index.js';
import { parseJsonText } from '../../packages/shared/src/json/json.helpers.js';
import {
  BINDINGS_STAMP,
  BUILD_STAMP,
  CONTRACT_DAR,
  CONTRACTS_DOCKERFILE,
  CONTRACTS_IMAGE,
  CONTRACTS_IMAGE_STAMP,
  DEPLOY_STAMP,
  GENERATED_BINDINGS_DIR,
  INFRA_STAMP,
  JSON_API_URLS,
  PARTIES_FILE,
  SCRIPT_DAR,
  SHARED_STAMP,
  TEST_STAMP,
} from './config.js';
import {
  compose,
  currentInfraId,
  resetPqsDatabases,
  restartPqsServices,
  runContracts,
  runWorkspace,
  waitForParticipantPorts,
} from './docker.js';
import {
  ensureDir,
  fileExists,
  hashPaths,
  hashSelectedFiles,
  listFiles,
  readStamp,
  readText,
  removePath,
  rootPath,
  writeStamp,
  writeText,
} from './files.js';
import { fetchAdminToken, fetchPqsToken, jwtSub, writeAuthFiles } from './keycloak.js';
import { run, sleep, tryRun } from './process.js';
import { log } from './output.js';

export async function ensureSharedBuild(): Promise<void> {
  const hash = await sharedHash();

  if (readStamp(SHARED_STAMP) === hash && fileExists('packages/shared/dist/index.js')) {
    return;
  }

  run('npx', ['tsc', '-p', 'packages/shared/tsconfig.json']);
  writeStamp(SHARED_STAMP, hash);
}

export async function ensureBuild(): Promise<void> {
  const hash = await sourceHash();

  await ensureContractsImage();

  if (readStamp(BUILD_STAMP) === hash && contractsArtifactsExist()) {
    return;
  }

  runWorkspace(['sh', '-lc', 'cd contracts/daml && dpm build && cd ../daml-test && dpm build && cd ../../scripts/daml && dpm build']);
  writeStamp(BUILD_STAMP, hash);
}

export async function ensureBindings(): Promise<void> {
  const hash = await sourceHash();

  if (readStamp(BINDINGS_STAMP) === hash && bindingsExist()) {
    return;
  }

  removePath(GENERATED_BINDINGS_DIR);
  ensureDir(GENERATED_BINDINGS_DIR);
  runWorkspace(['dpm', 'codegen-js', '-o', GENERATED_BINDINGS_DIR, CONTRACT_DAR]);
  writeStamp(BINDINGS_STAMP, hash);
}

export async function ensureTests(): Promise<void> {
  const hash = await sourceHash();

  if (readStamp(TEST_STAMP) === hash) {
    return;
  }

  runWorkspace(['sh', '-lc', 'cd contracts/daml-test && dpm test']);
  writeStamp(TEST_STAMP, hash);
}

export async function deployedStateMatchesCurrentBuild(): Promise<boolean> {
  const hash = await deployHash();

  return readStamp(DEPLOY_STAMP) === hash && fileExists(PARTIES_FILE);
}

export async function ensureDeploy(): Promise<void> {
  const infraId = currentInfraId();
  const previousInfra = readStamp(INFRA_STAMP);

  if (previousInfra.length > 0 && previousInfra !== infraId) {
    removePath(PARTIES_FILE);
    removePath(DEPLOY_STAMP);
    resetPqsDatabases();
  }

  const hash = await deployHash();
  if (readStamp(DEPLOY_STAMP) === hash && fileExists(PARTIES_FILE)) {
    return;
  }

  await deployContracts();
  writeStamp(INFRA_STAMP, infraId);
  writeStamp(DEPLOY_STAMP, hash);
}

export async function deployContracts(): Promise<void> {
  ensureDir('.demo');
  log('Preparing ledger admin auth...');
  writeAuthFiles();
  log('Waiting for participants...');
  await waitForParticipants();
  log('Uploading contract DARs...');
  await uploadContractDars();

  if (!fileExists(PARTIES_FILE)) {
    log('Allocating demo parties...');
    if (!(await runDamlScript('DemoMoneyDeploy:allocateParties', '--output-file'))) {
      throw new Error('Could not allocate demo parties.');
    }
  }

  log('Granting ledger API rights...');
  if (!(await grantDemoUsersAndRestartPqs())) {
    removePath(PARTIES_FILE);
    log('Allocating demo parties...');
    if (!(await runDamlScript('DemoMoneyDeploy:allocateParties', '--output-file'))) {
      throw new Error('Could not allocate demo parties after retry.');
    }
    log('Granting ledger API rights...');
    if (!(await grantDemoUsersAndRestartPqs())) {
      throw new Error('Could not grant demo users after party reallocation.');
    }
  }

  log('Setting initial state...');
  if (!(await runDamlScript('DemoMoneyDeploy:setupInitialState', '--input-file'))) {
    removePath(PARTIES_FILE);
    log('Allocating demo parties...');
    if (!(await runDamlScript('DemoMoneyDeploy:allocateParties', '--output-file'))) {
      throw new Error('Could not allocate demo parties after setup retry.');
    }
    log('Granting ledger API rights...');
    if (!(await grantDemoUsersAndRestartPqs())) {
      throw new Error('Could not grant demo users after setup retry.');
    }
    log('Setting initial state...');
    if (!(await runDamlScript('DemoMoneyDeploy:setupInitialState', '--input-file'))) {
      throw new Error('Could not initialize demo ledger state.');
    }
  }
}

export async function waitForSynchronizerConnections(token: string): Promise<void> {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    let ready = true;

    for (const url of JSON_API_URLS) {
      const response = await fetch(`${url}/v2/state/connected-synchronizers`, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5_000),
      }).catch(() => undefined);

      if (!response?.ok) {
        ready = false;
        break;
      }

      const payload = parseJsonText(await response.text());
      if (!isObject(payload) || !Array.isArray(payload.connectedSynchronizers) || payload.connectedSynchronizers.length === 0) {
        ready = false;
        break;
      }
    }

    if (ready) return;
    await sleep(3_000);
  }

  throw new Error('Participants did not connect to the demo synchronizer within 120 seconds.');
}

async function ensureContractsImage(): Promise<void> {
  const imageHash = await hashSelectedFiles([CONTRACTS_DOCKERFILE]);
  if (contractsImageExists() && readStamp(CONTRACTS_IMAGE_STAMP) === imageHash) {
    return;
  }

  run('docker', ['build', '-t', CONTRACTS_IMAGE, '-f', CONTRACTS_DOCKERFILE, 'docker']);
  writeStamp(CONTRACTS_IMAGE_STAMP, imageHash);
}

async function sourceHash(): Promise<string> {
  const files = await listFiles(['contracts', 'scripts/daml']);
  const damlFiles = files.filter((file) =>
    !file.includes('/.daml/') && (file.endsWith('.daml') || file.endsWith('daml.yaml'))
  );

  return hashSelectedFiles([...damlFiles, 'multi-package.yaml', CONTRACTS_DOCKERFILE]);
}

async function sharedHash(): Promise<string> {
  return hashPaths(['packages/shared/src', 'packages/shared/package.json', 'packages/shared/tsconfig.json']);
}

async function deployHash(): Promise<string> {
  const scriptFiles = (await listFiles(['scripts/canton-demo.ts', 'scripts/commands', 'scripts/internal']))
    .filter((file) => file.endsWith('.ts'));
  const hash = await hashSelectedFiles([
    ...scriptFiles,
    CONTRACT_DAR,
    SCRIPT_DAR,
    'config/keycloak/canton-demo-realm.json',
    'config/participant-bank.conf',
    'config/participant-users.conf',
    'config/participant-observer.conf',
    'config/daml-script-participants.json',
    'package.json',
  ]);

  return createHash('sha256').update(`infra=${currentInfraId()}\n${hash}`).digest('hex');
}

function contractsImageExists(): boolean {
  return tryRun('docker', ['image', 'inspect', CONTRACTS_IMAGE]).ok;
}

function contractsArtifactsExist(): boolean {
  return fileExists(CONTRACT_DAR) && fileExists(SCRIPT_DAR);
}

function bindingsExist(): boolean {
  return fileExists('backend/src/generated/daml/canton-demo-money-0.1.0/package.json');
}

async function waitForParticipants(): Promise<void> {
  const token = readText('.demo/admin.token');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await waitForParticipantPorts();
    await waitForSynchronizerConnections(token);
    await sleep(2_000);
  }
}

async function uploadContractDars(): Promise<void> {
  const token = readText('.demo/admin.token');

  for (const url of JSON_API_URLS) {
    await uploadContractDar(url, token);
  }
}

async function uploadContractDar(url: string, token: string): Promise<void> {
  const body = readFileSync(rootPath(CONTRACT_DAR));
  let lastFailure = '';

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    if (!(await waitForJsonApi(url, token))) {
      lastFailure = 'JSON API did not become ready';
      await sleep(attempt * 2_000);
      continue;
    }

    const response = await fetch(`${url}/v2/dars?vetAllPackages=true`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/octet-stream',
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    if (response.ok) return;
    lastFailure = `${response.status} ${response.statusText}: ${await response.text()}`;
    await sleep(attempt * 2_000);
  }

  throw new Error(`Failed to upload contract DAR to ${url}. ${lastFailure}`);
}

async function waitForJsonApi(url: string, token: string): Promise<boolean> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(`${url}/v2/packages`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    }).catch(() => undefined);

    if (response?.ok) return true;
    await sleep(1_000);
  }

  return false;
}

async function runDamlScript(scriptName: string, fileFlag: '--input-file' | '--output-file'): Promise<boolean> {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    await waitForParticipants();

    try {
      runDamlScriptOnce(scriptName, fileFlag);
      return true;
    } catch {
      await sleep(attempt * 3_000);
    }
  }

  return false;
}

function runDamlScriptOnce(scriptName: string, fileFlag: '--input-file' | '--output-file'): void {
  const adminUserId = jwtSub(readText('.demo/admin.token'));

  runContracts([
    'dpm',
    'script',
    '--dar',
    `/workspace/${SCRIPT_DAR}`,
    '--script-name',
    scriptName,
    '--participant-config',
    '/workspace/config/daml-script-participants.json',
    '--upload-dar',
    'no',
    '--access-token-file',
    '/workspace/.demo/admin.token',
    '--user-id',
    adminUserId,
    fileFlag,
    '/workspace/.demo/parties.json',
  ], { capture: true, timeoutMs: 120_000 });
}

async function grantDemoUsersAndRestartPqs(): Promise<boolean> {
  const granted = await grantDemoUsersWithRetry();
  if (granted) {
    restartPqsServices();
  }

  return granted;
}

async function grantDemoUsersWithRetry(): Promise<boolean> {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    await waitForParticipants();

    try {
      grantDemoUsers();
      return true;
    } catch {
      await sleep(attempt * 3_000);
    }
  }

  return false;
}

function grantDemoUsers(): void {
  const pqsUserId = jwtSub(fetchPqsToken());
  const parties = loadParties();
  writeText('.demo/grant-users.sc', grantConsoleScript(pqsUserId, parties));

  runContracts([
    'dpm',
    'canton-console',
    '--no-tty',
    '-c',
    '/workspace/.demo/canton-console-auth.conf',
    '--bootstrap',
    '/workspace/.demo/grant-users.sc',
  ], { capture: true, timeoutMs: 120_000 });
}

function loadParties(): DemoParties {
  const parsed = parseJsonText(readText(PARTIES_FILE));
  if (!isObject(parsed)) {
    throw new Error(`${PARTIES_FILE} is not a JSON object.`);
  }

  for (const alias of PARTY_ALIASES) {
    if (typeof parsed[alias] !== 'string') {
      throw new Error(`${PARTIES_FILE} is missing party: ${alias}`);
    }
  }

  return parsed as DemoParties;
}

function grantConsoleScript(pqsUserId: string, parties: DemoParties): string {
  return `import com.digitalasset.canton.console.RemoteParticipantReference
import com.digitalasset.canton.topology.PartyId

def resolveParty(p: RemoteParticipantReference, party: String): PartyId =
  p.parties
    .list(filterParty = party)
    .find(_.party.toProtoPrimitive == party)
    .map(_.party)
    .getOrElse(throw new RuntimeException("party not hosted on " + p.id + ": " + party))

def userExists(p: RemoteParticipantReference, userId: String): Boolean = {
  var pageToken = ""
  var found = false
  var done = false

  while (!done && !found) {
    val page = p.ledger_api.users.list(pageToken = pageToken, pageSize = 1000)
    found = page.users.exists(_.id == userId)
    pageToken = page.nextPageToken
    done = pageToken.isEmpty
  }

  found
}

def ensureUser(p: RemoteParticipantReference, userId: String): Unit =
  if (!userExists(p, userId)) p.ledger_api.users.create(id = userId)

def grantPartyUser(
    p: RemoteParticipantReference,
    userId: String,
    actAsParties: Set[PartyId],
    readAsParties: Set[PartyId]
): Unit = {
  ensureUser(p, userId)
  p.ledger_api.users.rights.grant(userId, actAs = actAsParties, readAs = readAsParties)
}

def grantPqsUser(
    p: RemoteParticipantReference,
    userId: String,
    readAsParties: Set[PartyId]
): Unit = {
  ensureUser(p, userId)
  p.ledger_api.users.rights.grant(userId, readAs = readAsParties)
}

val bankParty = resolveParty(bank, "${parties.bank}")
val aliceParty = resolveParty(users, "${parties.alice}")
val bobParty = resolveParty(users, "${parties.bob}")
val goshoParty = resolveParty(users, "${parties.gosho}")
val petyoParty = resolveParty(observer, "${parties.petyo}")

grantPartyUser(bank, "bank", Set(bankParty), Set(bankParty))
grantPartyUser(users, "alice", Set(aliceParty), Set(aliceParty))
grantPartyUser(users, "bob", Set(bobParty), Set(bobParty))
grantPartyUser(users, "gosho", Set(goshoParty), Set(goshoParty))
grantPartyUser(observer, "petyo", Set.empty[PartyId], Set(petyoParty))

val pqsUserId = "${pqsUserId}"
grantPqsUser(bank, pqsUserId, Set(bankParty))
grantPqsUser(users, pqsUserId, Set(aliceParty, bobParty, goshoParty))
grantPqsUser(observer, pqsUserId, Set(petyoParty))
`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
