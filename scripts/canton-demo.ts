import { buildContracts, deployContractsCommand, testContracts } from './commands/deploy-contracts.js';
import { cleanInfra, startInfra, stopInfra } from './commands/infra.js';
import { start } from './commands/start.js';
import { fail } from './internal/output.js';

const commands = {
  start,
  'start-infra': startInfra,
  'stop-infra': stopInfra,
  'clean-infra': cleanInfra,
  'build-contracts': buildContracts,
  'test-contracts': testContracts,
  'deploy-contracts': deployContractsCommand,
} satisfies Record<string, () => void | Promise<void>>;

type Command = keyof typeof commands;

async function main(): Promise<void> {
  const command = process.argv[2];

  if (!command || !isCommand(command)) {
    throw new Error(`Unknown command: ${command ?? '(missing)'}`);
  }

  await commands[command]();
}

function isCommand(command: string): command is Command {
  return command in commands;
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
