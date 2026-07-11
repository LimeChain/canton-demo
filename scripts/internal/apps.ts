import { run } from './process.js';

export function ensureAppBuilds(): void {
  run('npm', ['--prefix', 'backend', 'install'], { capture: true });
  run('npm', ['--prefix', 'backend', 'run', 'typecheck']);
  run('npm', ['--prefix', 'backend', 'run', 'build']);

  run('npm', ['--prefix', 'frontend', 'install'], { capture: true });
  run('npm', ['--prefix', 'frontend', 'run', 'build']);
}
