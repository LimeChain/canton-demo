import {
  deployedStateMatchesCurrentBuild,
  ensureBindings,
  ensureBuild,
  ensureDeploy,
  ensureSharedBuild,
  ensureTests,
  waitForSynchronizerConnections,
} from '../internal/daml.js';
import { ensureAppBuilds } from '../internal/apps.js';
import { composeInherit, infraReady, requireDocker, resetDemoInfra, waitForInfra, waitForPqs } from '../internal/docker.js';
import { removePath } from '../internal/files.js';
import { fetchAdminToken } from '../internal/keycloak.js';
import { log } from '../internal/output.js';

export async function start(): Promise<void> {
  requireDocker();

  log('Building shared package...');
  await ensureSharedBuild();
  log('Building contracts...');
  await ensureBuild();
  log('Generating backend bindings...');
  await ensureBindings();
  log('Checking backend and frontend...');
  ensureAppBuilds();
  await resetStaleInfraIfNeeded();
  log('Starting infrastructure...');
  await ensureInfra();
  log('Running contract tests...');
  await ensureTests();
  log('Deploying contracts...');
  await ensureDeploy();
  log('Waiting for PQS...');
  await waitForPqs();

  log('Ready: http://localhost:5173');
}

async function resetStaleInfraIfNeeded(): Promise<void> {
  if (!infraReady() || await deployedStateMatchesCurrentBuild()) {
    return;
  }

  log('Current contracts differ from the deployed local demo ledger; recreating demo infra...');
  resetDemoInfra();
  removePath('.demo');
}

async function ensureInfra(): Promise<void> {
  if (!infraReady()) {
    composeInherit(['up', '-d', '--build']);
    await waitForInfra();
  }

  await waitForSynchronizerConnections(fetchAdminToken());
}
