import { CONTRACTS_IMAGE } from '../internal/config.js';
import { composeInherit, requireDocker } from '../internal/docker.js';
import { removePath } from '../internal/files.js';
import { tryRun } from '../internal/process.js';

export function startInfra(): void {
  requireDocker();
  composeInherit(['up', '-d', '--build']);
}

export function stopInfra(): void {
  requireDocker();
  composeInherit(['down']);
}

export function cleanInfra(): void {
  requireDocker();
  tryRun('docker', ['compose', 'down', '--volumes', '--remove-orphans', '--rmi', 'all']);
  tryRun('docker', ['image', 'rm', '-f', CONTRACTS_IMAGE]);

  for (const path of [
    '.contracts-image',
    '.demo',
    'contracts/daml/.daml',
    'contracts/daml-test/.daml',
    'scripts/daml/.daml',
    'frontend/dist',
    'backend/dist',
    'backend/src/generated',
    'packages/shared/dist',
  ]) {
    removePath(path);
  }
}
