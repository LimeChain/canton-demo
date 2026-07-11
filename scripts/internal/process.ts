import { spawnSync, type StdioOptions } from 'node:child_process';

import { ROOT_DIR } from './config.js';

export type RunOptions = {
  capture?: boolean;
  cwd?: string;
  input?: string;
  timeoutMs?: number;
};

export function run(command: string, args: string[], options: RunOptions = {}): string {
  const stdio = (
    options.capture ? 'pipe' : options.input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit']
  ) as StdioOptions;

  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT_DIR,
    encoding: 'utf8',
    input: options.input,
    stdio,
    env: process.env,
    timeout: options.timeoutMs,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const rendered = [command, ...args].join(' ');
    const output = `${typeof result.stdout === 'string' ? result.stdout : ''}${typeof result.stderr === 'string' ? result.stderr : ''}`;
    const details = output.trim().length > 0 ? `\n${output}` : '';
    throw new Error(`Command failed: ${rendered}${details}`);
  }

  return typeof result.stdout === 'string' ? result.stdout : '';
}

export function tryRun(command: string, args: string[]): { ok: boolean; stdout: string } {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env,
  });

  return {
    ok: result.status === 0,
    stdout: `${typeof result.stdout === 'string' ? result.stdout : ''}${typeof result.stderr === 'string' ? result.stderr : ''}`,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
