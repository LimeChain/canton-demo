import { ensureBindings, ensureBuild, ensureDeploy, ensureSharedBuild, ensureTests } from '../internal/daml.js';
import { infraReady, requireDocker } from '../internal/docker.js';
import { log } from '../internal/output.js';

export async function buildContracts(): Promise<void> {
  requireDocker();
  log('Building contracts...');
  await ensureBuild();
}

export async function testContracts(): Promise<void> {
  requireDocker();
  log('Building contracts...');
  await ensureBuild();
  log('Running contract tests...');
  await ensureTests();
}

export async function deployContractsCommand(): Promise<void> {
  requireDocker();

  if (!infraReady()) {
    throw new Error('Canton demo infra is not running. Run: npm run start');
  }

  log('Building shared package...');
  await ensureSharedBuild();
  log('Building contracts...');
  await ensureBuild();
  log('Generating backend bindings...');
  await ensureBindings();
  log('Deploying contracts...');
  await ensureDeploy();
}
