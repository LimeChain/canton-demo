# Infrastructure

What runs when the local demo infrastructure is started.

## Container Inventory

| Container | Purpose | Host ports |
| --- | --- | --- |
| `canton-demo-keycloak` | Local identity provider. Imports the `canton-demo` realm and demo users. | `8080` |
| `canton-demo-synchronizer` | Local Canton synchronizer container. Runs `sequencer1` and `mediator1`. | `5001`, `5002`, `5202` |
| `canton-demo-participant-bank` | Canton participant hosting the Bank party. | `5011`, `5012`, `5013` |
| `canton-demo-participant-users` | Canton participant hosting Alice, Bob, and Gosho. | `5021`, `5022`, `5023` |
| `canton-demo-participant-observer` | Canton participant hosting Petyo. | `5031`, `5032`, `5033` |
| `canton-demo-pqs-bank` | PQS pipeline reading from `participant-bank`. | internal only |
| `canton-demo-pqs-users` | PQS pipeline reading from `participant-users`. | internal only |
| `canton-demo-pqs-observer` | PQS pipeline reading from `participant-observer`. | internal only |
| `canton-demo-pqs-postgres` | Postgres server used by PQS read models. | `65432` |
| `canton-demo-backend` | NestJS API used by the UI. | `3000` |
| `canton-demo-frontend` | Vite React UI. | `5173` |

## Canton Nodes

### Synchronizer

The local synchronizer is configured in `config/synchronizer.conf` and bootstrapped by `config/bootstrap-synchronizer.canton`.

It runs:

| Component | Local name | What it does |
| --- | --- | --- |
| Sequencer | `sequencer1` | Orders and delivers Canton protocol messages. Participants connect to the synchronizer through the sequencer public API. |
| Mediator | `mediator1` | Coordinates participant confirmations in the transaction protocol and emits the transaction verdict. |

The synchronizer is the communication and coordination layer between participants. It is not the application owner, not the bank, and not the component that validates Daml business rules. Contract visibility, authorization, and Daml choice execution are still handled by participants and the Daml model.

### Participants

Participants are the Canton nodes that host parties, expose the Ledger API, validate transactions for their hosted parties, maintain contract state, and connect to the synchronizer.

This demo runs three participant nodes:

| Participant | Hosted demo parties | Why it exists |
| --- | --- | --- |
| `participant-bank` | Bank | Represents the institution side of the flow. |
| `participant-users` | Alice, Bob, Gosho | Represents normal users sharing one participant. |
| `participant-observer` | Petyo | Represents an observer/viewer on a separate participant. |

Running multiple participants is a demo architecture choice, not a requirement for this private network to function. The same Daml model could run with one participant hosting Bank, Alice, Bob, Petyo, and Gosho, and it would still work.

We keep multiple participants to demonstrate a more realistic network shape:

- Bank is hosted separately from users.
- Alice, Bob, and Gosho share one user participant.
- Petyo is hosted on a separate observer participant.


### Command Execution Flow

The Daml package is uploaded to the participants. The participants need the package so they can interpret templates, choices, keys, and payloads. The synchronizer (sequencer + mediator) on other hand coordinates the transaction protocol between participants.

A write command flows like this:

1. Backend submits a command to a participant JSON API.
2. The participant interprets the Daml command using its installed DAR.
3. The participant determines which other participants and stakeholders are involved.
4. Participants exchange Canton protocol messages through the synchronizer.
5. The sequencer orders and delivers those protocol messages.
6. The mediator collects confirmations and emits the transaction verdict.
7. Participants update their local contract stores if the transaction is accepted.
8. PQS reads each participant's ledger stream and projects visible state to Postgres.

## Application Services

### Keycloak

Keycloak is the local identity provider.

It imports `config/keycloak/canton-demo-realm.json`, which defines:

| Client or user | Purpose |
| --- | --- |
| `canton-demo-ui` | Browser login client used by the React app. |
| `canton-demo-admin` | Bootstrap service client used by setup scripts. |
| `canton-demo-pqs` | Service client used by PQS. |
| `bank`, `alice`, `bob`, `petyo`, `gosho` | Demo users. |

The participants trust Keycloak JWTs through their `ledger-api.auth-services` configuration.

### Backend

The backend is the API used by the browser UI.

It does two different things:

| Path | What happens |
| --- | --- |
| Writes | The backend forwards the logged-in user's JWT to the right participant JSON API. |
| Reads | The backend queries PQS Postgres tables and filters by the authenticated party visibility scope. |

The backend does not grant ledger authority by itself. For writes, the participant checks the JWT and Ledger API rights, then Daml checks the contract authorization rules.

### Frontend

The frontend is the Vite React UI on:

```text
http://localhost:5173
```

It logs users in through Keycloak and calls the backend at `/api`.

## PQS Read Model

PQS is not a database. PQS is a projection service that reads a participant's Ledger API stream and writes queryable rows into Postgres.

This demo runs one PQS instance per participant access scope:

| PQS container | Reads from | Writes to database |
| --- | --- | --- |
| `pqs-bank` | `participant-bank:5011` | `pqs_bank` |
| `pqs-users` | `participant-users:5011` | `pqs_users` |
| `pqs-observer` | `participant-observer:5011` | `pqs_observer` |

All three databases live inside the same Postgres container:

```text
canton-demo-pqs-postgres
```

The databases are created by `config/postgres/init-pqs.sql`.

The backend chooses the PQS database by authenticated actor:

| Actor | PQS database |
| --- | --- |
| `bank` | `pqs_bank` |
| `alice` | `pqs_users` |
| `bob` | `pqs_users` |
| `gosho` | `pqs_users` |
| `petyo` | `pqs_observer` |

PQS is only a read model. It cannot execute choices, create contracts, bypass Daml authorization, or make a party see contracts that are not visible to that party on its participant.
