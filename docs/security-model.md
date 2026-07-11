# Security Model

The demo intentionally does not hide unsupported actions in the UI. A user can click actions they are not allowed to perform, so the result panel can show the actual ledger/API rejection.

Canton authorization is enforced in layers. The important point is that the JWT does not simply mean "this user can do anything as Alice". The command must also declare which Ledger API user is submitting and which Canton party authority it wants to use.

```text
Keycloak login
  -> JWT proves the web identity
  -> backend verifies the JWT and maps it to a demo actor
  -> backend submits a command with userId + actAs + command payload
  -> participant verifies the JWT and checks the Ledger API user's rights
  -> Daml checks whether the requested party can exercise the contract choice
```

## Identity, intent, and authority

There are three different concepts involved:

| Concept | Meaning in the demo |
| --- | --- |
| Keycloak user | Web identity used to login, for example `alice` |
| Ledger API user | Participant-local API user, also named `alice` in this demo |
| Canton party | On-ledger identity, for example `Alice::...` |

In this demo the names are intentionally aligned:

```text
Keycloak user "alice"
  -> JWT subject / username identifies alice
  -> backend sends userId = "alice"
  -> backend may request actAs = Alice::...
```

But the `actAs` value is not granted by the frontend. It is only a requested authority for this command. The participant checks whether the Ledger API user is actually allowed to use that party authority.

Example command shape:

```json
{
  "userId": "alice",
  "actAs": ["Alice::..."],
  "commands": ["exercise RequestTransfer ..."]
}
```

Meaning:

```text
userId = "alice"
  The command is submitted as the participant-local Ledger API user alice.

actAs = ["Alice::..."]
  The command asks to use Alice's party authority.

commands
  The actual ledger operation, for example exercising RequestTransfer.
```

The participant accepts this only if the authenticated token maps to the expected user and that Ledger API user has the requested rights.

## Granted rights

During bootstrap, the demo creates participant-local Ledger API users and grants explicit party rights:

| User | Ledger API rights |
| --- | --- |
| `bank` | Can `actAs` and `readAs` Bank |
| `alice` | Can `actAs` and `readAs` Alice |
| `bob` | Can `actAs` and `readAs` Bob |
| `petyo` | Can `readAs` Petyo only |
| `gosho` | Can `actAs` and `readAs` Gosho |

This gives us different rejection points:

| Attempt | Where it fails |
| --- | --- |
| Alice sends `userId = alice`, `actAs = Alice` | Participant accepts the API authority check |
| Alice sends `userId = alice`, `actAs = Bob` | Participant rejects it because Alice does not have `CanActAs Bob` |
| Petyo sends any command with `actAs = Petyo` | Participant rejects it because Petyo only has `readAs Petyo`, not `actAs Petyo` |
| Alice uses `actAs = Alice` but tries to execute a bank-only choice | Participant may accept the API authority, then Daml rejects the choice |

## Daml contract rules

After the participant accepts the API identity and requested party authority, Daml still checks the contract model:

```text
controller owner
controller bank
signatory bank
observer owner, viewers
```

So `actAs Alice` only proves that the command can use Alice's party authority. It does not let Alice exercise a choice controlled by Bank.

Examples:

| Action | Expected result |
| --- | --- |
| Alice requests transfer from Alice's account | Allowed |
| Petyo requests transfer from Alice's account | Rejected because Petyo is not the controller |
| Alice executes a pending transfer | Rejected because only Bank controls execution |
| Bank issues a new account | Allowed |
| Alice tries to issue a new account | Rejected because only Bank controls account issuance |
| Bank credits or debits an account | Allowed |
| Alice tries to credit or debit an account | Rejected because only Bank controls balance adjustments |

So authority is not decided by the frontend. The frontend only submits commands. The participant and Daml model decide whether they are valid.

## Visibility and privacy

Contracts are only visible to their stakeholders:

| Contract | Visible to |
| --- | --- |
| Alice `BankAccount` | Bank, Alice, Petyo |
| Bob `BankAccount` | Bank, Bob, Petyo |
| Gosho `BankAccount` | Bank, Gosho, Petyo, after Bank issues it |
| `TransferInstruction` | Sender, Bank, Petyo |

Gosho is on the network as a party, but at the start he is not a bank account holder. He cannot see Alice/Bob accounts and cannot perform useful money-transfer actions until Bank issues him a `BankAccount`.

## Reads and writes

Writes go through the participant JSON API:

```text
backend -> participant JSON API -> Canton Ledger API -> Daml execution
```

Reads are served from PQS:

```text
participant ledger stream -> PQS -> Postgres -> backend -> UI
```

The backend still filters PQS rows by the authenticated party's visibility scope. PQS is a read model; it does not grant ledger authority and it cannot bypass Daml authorization.
