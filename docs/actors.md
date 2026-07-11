# Actors

This demo models a small bank-controlled money transfer flow on Canton.

The important distinction is that the names below are **demo users in the UI**, while Canton represents them on-ledger as **parties**. A party is the Canton identity that can see contracts, sign contract creation, or exercise choices when the Daml model allows it.

| Actor | Role in the demo | Ledger authority |
| --- | --- | --- |
| `bank` | The institution that issues and maintains bank accounts. | Can create `BankAccount` contracts, credit/debit balances, and execute pending transfer instructions. |
| `alice` | Bank customer with an initial balance. | Can see her own account and request transfers from her own balance. |
| `bob` | Bank customer with an initial balance. | Can see his own account and request transfers from his own balance. |
| `petyo` | Observer. | Can see Alice and Bob account state, but cannot move funds. |
| `gosho` | Unrelated user. | He is part of the network as a party, but has no useful rights in this application model at the start, so pretty much can't do anything, unless bank issues him a `BankAccount` contract |

For local demo usage, Keycloak is preloaded with the same usernames as the actors above. The password is the same as the username, so `alice` logs in with `alice`, `bank` logs in with `bank`, and so on. Logging out and logging in as another user changes the authenticated ledger actor used by the UI.

The demo starts with:

| Owner | Initial balance |
| --- | ---: |
| `alice` | `50` |
| `bob` | `50` |

Transfers are intentionally split into two steps:

1. Alice or Bob requests a transfer from their own account.
2. Bank processes the pending transfer and updates the account balances.
