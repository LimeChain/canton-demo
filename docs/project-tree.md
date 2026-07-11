# Project Tree

```text
canton-demo/
├── frontend/             Vite React UI
├── backend/              NestJS API used by the UI
├── contracts/
│   ├── daml/             Deployable Daml contract package
│   └── daml-test/        Daml Script tests for the contract model
├── config/               Canton, Keycloak, and Postgres configuration
├── docker/               Docker image files and entrypoints
├── docs/                 Architecture notes and diagrams
├── packages/
│   └── shared/           Shared FE/BE TS constants, types, and helpers.
├── scripts/
│   ├── commands/         Top-level npm command implementations
│   ├── daml/             Daml deployment/setup scripts
│   └── internal/         Script helpers for Docker, Daml, Keycloak, and files
├── docker-compose.yml    Local Canton demo infrastructure
├── multi-package.yaml    Daml multi-package workspace
└── package.json          Root npm commands
```
