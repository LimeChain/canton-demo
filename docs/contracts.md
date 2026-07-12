# Contracts

Casting some light to the Daml contract model in `contracts/daml/DemoMoney.daml`.

## Why SDK 3.5.1

The reason for using Canton/Daml 3.5 instead of an earlier 3.4x version, that we mostly used on a project level is the stable contract-key support. Well, in matter of fact Digital Asset have deprecated them at some point, now bring them back.. but anyways..

Canton 3.5.1 re-introduces contract keys for Daml-LF 2.3 / protocol version 35 and onwards. This demo uses keys to look up the current active account by a stable business keys. But what that does mean?

That lets the model find an account by `(bank, owner)` instead of making the UI or scripts carry raw `ContractId` values everywhere.

This matters because Daml contracts are immutable. When a balance changes, the old `BankAccount` is archived and a new `BankAccount` is created. The new contract has a new `ContractId`, so a CID-driven flow is hm... awkward or harder to orginize to say the least, and also brings problems along (ask Ivaylo Bakalov)

So:
```text
Alice account CID before transfer != Alice account CID after transfer
```

With keys, the user-facing model can stay business-oriented:

Simplified:
```text
find Alice's account at Bank
```

instead of:
```text
find and pass the latest raw ContractId for Alice's current BankAccount
```

Well, contract IDs still exist, and the backend still submits commands against concrete active contracts where the JSON API requires it. The point is narrower though: the business flow no longer needs to pass sender/receiver account CIDs as user-facing choice arguments. Inside the Daml model, the current sender and receiver accounts can be resolved by those stable keys.

And one important limitation: Contract keys are not unique infrastructure magic and same party values in another template will not collide. Duplicate-key risk exists only for the same keyed template. Because Canton 3.5 keys are not uniqueness constraints and the app must prevent duplicates at creation time and detect them with lookupNByKey in flows where uniqueness is assumed. Let's say, they should be used mindfully. 

So in this repo, keys are a stable lookup mechanism, not a replacement for business invariants.

## Daml Basics Used Here

| Concept | Meaning in this demo |
| --- | --- |
| Template | A blueprint for ledger contracts, similar to a contract type. |
| Contract | An active ledger instance created from a template. |
| ContractId | The unique identifier of a specific contract instance. It changes when a contract is archived and recreated. |
| Signatory | Party whose authorization is required to create the contract. Signatories are stakeholders and can see the contract. |
| Observer | Party that can see the contract but does not sign it. |
| Choice | Operation that can be exercised on a contract. |
| Controller | Party whose authorization is required to exercise a choice. |
| Consuming choice | Default choice behavior. Exercising it archives the contract. |
| Nonconsuming choice | Choice that leaves the exercised contract active. |
| Contract key | Stable business lookup value for a contract template. |
| Maintainer | Party responsible for the key namespace. |
| `ensure` | Template-level condition checked when creating a contract. |
| `assertMsg` / `fail` | Choice-level validation that aborts the transaction if violated. |

Thae demo concept is represented by multiple Daml templates. Each template creates a different kind of ledger contract:

| Template | Ledger contract meaning |
| --- | --- |
| `BankAccountDirectory` | Bank-controlled list of parties that are valid account holders. |
| `BankAccount` | One customer's current balance at one bank. |
| `TransferInstruction` | A pending transfer request created by an account owner and later executed by the bank. |

## BankAccountDirectory

`BankAccountDirectory` is the bank-published transfer directory.

Purpose:
- tracks who is onboarded as a valid account holder at the bank;
- lets account owners validate transfer recipients without seeing each other's balances;
- gives the bank a single place to issue new accounts through `IssueAccount`.

Choice:
| Choice | Controller | Consuming? | Result |
| --- | --- | --- | --- |
| `IssueAccount` | `bank` | Yes, default | Replaces the directory with the new owner added and creates a `BankAccount`. |


## BankAccount

`BankAccount` represents one customer's balance at one bank.

Purpose:
- stores the current account balance;
- lets the owner request transfers;
- lets the bank credit/debit balances;
- lets configured viewers observe the account.

Choices:

| Choice | Controller | Consuming? | Result |
| --- | --- | --- | --- |
| `AdjustBalance` | `bank` | Yes, default | Archives the old account and creates a replacement with the credited/debited balance. |
| `RequestTransfer` | `owner` | No | Keeps the account active and creates a `TransferInstruction`. |

## TransferInstruction

`TransferInstruction` is the pending transfer request.

Purpose:
- records that the sender requested a transfer;
- gives Bank a visible, executable instruction;
- separates customer intent from bank posting.
