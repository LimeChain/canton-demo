# Demo Commands

## First run

Install root script dependencies once:

```sh
npm install
```

Start the complete local demo:

```sh
npm run start
```

This is the normal entrypoint. It:

1. builds the shared TypeScript package;
2. builds the Daml contracts and Daml scripts;
3. generates backend Daml bindings;
4. checks backend and frontend builds;
5. starts the Docker infrastructure;
6. runs the Daml contract tests;
7. deploys the contracts and initial demo state;
8. waits for PQS to be ready;
9. prints the UI URL.

When it finishes, open:

```text
http://localhost:5173
```

And it might take a while when running for a first time, so bare with me.

## Other Terminal commands

| Command | Purpose |
| --- | --- |
| `npm run start` | Full end-to-end startup. Use this by default. |
| `npm run start:infra` | Start Docker infrastructure only. Does not build, test, deploy, or generate bindings. |
| `npm run stop:infra` | Stop the local Docker infrastructure without deleting volumes. |
| `npm run clean:infra` | Remove demo containers, volumes, generated build output, local demo state, and demo images. |
| `npm run build:contracts` | Build the Daml packages using the Dockerized Daml toolchain. |
| `npm run test:contracts` | Build contracts and run Daml tests. |
| `npm run deploy:contracts` | Build shared/contracts, generate backend bindings, and deploy current contracts to already running infra. |
| `npm run typecheck:scripts` | Typecheck the root TypeScript orchestration scripts. |

## Resetting the demo

For a normal stop:

```sh
npm run stop:infra
```

For a full reset of local demo state:

```sh
npm run clean:infra
npm run start
```

Use the full reset when you want to remove local ledger data, PQS databases, generated Daml artifacts, generated backend bindings, and local `.demo` state.
