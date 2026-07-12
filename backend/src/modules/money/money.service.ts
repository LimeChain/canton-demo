import { Injectable } from '@nestjs/common';
import {
  PARTY_ALIAS_BANK,
  PARTY_ALIAS_PETYO,
  formatDecimal,
  type AccountDto,
  type ActorSessionDto,
  type BalanceAdjustmentType,
  type PartyAlias,
  type PendingTransferDto,
  type ProcessPendingTransfersResponse,
} from '@canton-demo/shared/demo-money';
import { randomUUID } from 'node:crypto';

import {
  BANK_ACCOUNT_DIRECTORY_TEMPLATE,
  BANK_ACCOUNT_DIRECTORY_TEMPLATE_ID,
  BANK_ACCOUNT_PQS_TEMPLATE_FQN,
  BANK_ACCOUNT_TEMPLATE,
  BANK_ACCOUNT_TEMPLATE_ID,
  TRANSFER_INSTRUCTION_PQS_TEMPLATE_FQN,
  TRANSFER_INSTRUCTION_TEMPLATE,
  TRANSFER_INSTRUCTION_TEMPLATE_ID,
} from './money.constants';
import type { AuthenticatedUser } from '../auth/auth.service';
import { LedgerClient } from '../ledger/ledger.client';
import { PartiesService } from '../parties/parties.service';
import { PqsRepository, type PqsContract } from '../pqs/pqs.repository';
import type { BankAccountPayload, TransferInstructionPayload } from './money.types';

@Injectable()
export class MoneyService {
  constructor(
    private readonly partiesService: PartiesService,
    private readonly pqsRepository: PqsRepository,
    private readonly ledgerClient: LedgerClient,
  ) {}

  async getMe(actor: PartyAlias): Promise<ActorSessionDto> {
    const context = await this.partiesService.actorContext(actor);
    return {
      actor,
      actorParty: context.actorParty,
      parties: context.parties,
    };
  }

  async getVisibleAccounts(actor: PartyAlias): Promise<AccountDto[]> {
    const context = await this.partiesService.actorContext(actor);
    const accounts =
      await this.pqsRepository.findActiveByTemplate<BankAccountPayload>(
        actor,
        context.actorParty,
        BANK_ACCOUNT_PQS_TEMPLATE_FQN,
      );

    return accounts.map((account) => this.toAccountDto(account, context.parties));
  }

  async getVisibleAccountByOwner(
    actor: PartyAlias,
    owner: PartyAlias,
  ): Promise<AccountDto | undefined> {
    const context = await this.partiesService.actorContext(actor);
    const account =
      await this.pqsRepository.findActiveByContractKey<BankAccountPayload>(
        actor,
        context.actorParty,
        BANK_ACCOUNT_PQS_TEMPLATE_FQN,
        this.bankAccountKey(context.parties[PARTY_ALIAS_BANK], context.parties[owner]),
      );

    return account ? this.toAccountDto(account, context.parties) : undefined;
  }

  async getPendingTransfers(actor: PartyAlias): Promise<PendingTransferDto[]> {
    const context = await this.partiesService.actorContext(actor);
    const instructions =
      await this.pqsRepository.findActiveByTemplate<TransferInstructionPayload>(
        actor,
        context.actorParty,
        TRANSFER_INSTRUCTION_PQS_TEMPLATE_FQN,
      );

    return instructions.map((instruction) =>
      this.toInstructionDto(instruction, context.parties),
    );
  }

  async requestTransfer(
    user: AuthenticatedUser,
    receiver: PartyAlias,
    amount: string,
  ): Promise<unknown> {
    const context = await this.partiesService.actorContext(user.actor);
    const bankParty = context.parties[PARTY_ALIAS_BANK];

    return this.ledgerClient.submitAndWait(user.token, user.actor, {
      userId: user.actor,
      commandId: this.commandId('request-transfer'),
      actAs: [context.actorParty],
      commands: [
        {
          ExerciseByKeyCommand: {
            templateId: BANK_ACCOUNT_TEMPLATE_ID,
            contractKey: this.bankAccountKey(bankParty, context.actorParty),
            choice: BANK_ACCOUNT_TEMPLATE.RequestTransfer.choiceName,
            choiceArgument: BANK_ACCOUNT_TEMPLATE.RequestTransfer.argumentEncode({
              receiver: context.parties[receiver],
              transferAmount: amount,
            }),
          },
        },
      ],
    });
  }

  async issueAccount(
    user: AuthenticatedUser,
    owner: PartyAlias,
    initialBalance: string,
  ): Promise<unknown> {
    const context = await this.partiesService.actorContext(user.actor);
    const bankParty = context.parties[PARTY_ALIAS_BANK];

    return this.ledgerClient.submitAndWait(user.token, user.actor, {
      userId: user.actor,
      commandId: this.commandId('issue-account'),
      actAs: [context.actorParty],
      commands: [
        {
          ExerciseByKeyCommand: {
            templateId: BANK_ACCOUNT_DIRECTORY_TEMPLATE_ID,
            contractKey: BANK_ACCOUNT_DIRECTORY_TEMPLATE.keyEncode(bankParty),
            choice: BANK_ACCOUNT_DIRECTORY_TEMPLATE.IssueAccount.choiceName,
            choiceArgument:
              BANK_ACCOUNT_DIRECTORY_TEMPLATE.IssueAccount.argumentEncode({
                owner: context.parties[owner],
                initialBalance,
                viewers: [context.parties[PARTY_ALIAS_PETYO]],
              }),
          },
        },
      ],
    });
  }

  async adjustBalance(
    user: AuthenticatedUser,
    owner: PartyAlias,
    adjustmentType: BalanceAdjustmentType,
    amount: string,
  ): Promise<unknown> {
    const context = await this.partiesService.actorContext(user.actor);
    const bankParty = context.parties[PARTY_ALIAS_BANK];

    return this.ledgerClient.submitAndWait(user.token, user.actor, {
      userId: user.actor,
      commandId: this.commandId('adjust-balance'),
      actAs: [context.actorParty],
      commands: [
        {
          ExerciseByKeyCommand: {
            templateId: BANK_ACCOUNT_TEMPLATE_ID,
            contractKey: this.bankAccountKey(bankParty, context.parties[owner]),
            choice: BANK_ACCOUNT_TEMPLATE.AdjustBalance.choiceName,
            choiceArgument: BANK_ACCOUNT_TEMPLATE.AdjustBalance.argumentEncode({
              adjustmentType,
              amount,
            }),
          },
        },
      ],
    });
  }

  async processPendingTransfers(
    user: AuthenticatedUser,
  ): Promise<ProcessPendingTransfersResponse> {
    const context = await this.partiesService.actorContext(user.actor);
    const pending =
      await this.pqsRepository.findActiveByTemplate<TransferInstructionPayload>(
        user.actor,
        context.actorParty,
        TRANSFER_INSTRUCTION_PQS_TEMPLATE_FQN,
      );

    const outputs: unknown[] = [];
    for (const instruction of pending) {
      outputs.push(
        await this.ledgerClient.submitAndWait(user.token, user.actor, {
          userId: user.actor,
          commandId: this.commandId('execute-transfer'),
          actAs: [context.actorParty],
          commands: [
            {
              ExerciseCommand: {
                templateId: TRANSFER_INSTRUCTION_TEMPLATE_ID,
                contractId: instruction.contractId,
                choice: TRANSFER_INSTRUCTION_TEMPLATE.Execute.choiceName,
                choiceArgument: TRANSFER_INSTRUCTION_TEMPLATE.Execute.argumentEncode({}),
              },
            },
          ],
        }),
      );
    }

    return {
      processed: outputs.length,
      outputs,
    };
  }

  private toAccountDto(
    account: PqsContract<BankAccountPayload>,
    parties: Record<PartyAlias, string>,
  ): AccountDto {
    return {
      owner: this.aliasForParty(parties, account.payload.owner),
      ownerParty: account.payload.owner,
      balance: formatDecimal(account.payload.balance),
    };
  }

  private toInstructionDto(
    instruction: PqsContract<TransferInstructionPayload>,
    parties: Record<PartyAlias, string>,
  ): PendingTransferDto {
    return {
      sender: this.aliasForParty(parties, instruction.payload.sender),
      senderParty: instruction.payload.sender,
      receiver: this.aliasForParty(parties, instruction.payload.receiver),
      receiverParty: instruction.payload.receiver,
      amount: formatDecimal(instruction.payload.transferAmount),
    };
  }

  private aliasForParty(parties: Record<PartyAlias, string>, party: string): PartyAlias | string {
    const match = Object.entries(parties).find(([, partyId]) => partyId === party);
    return match ? (match[0] as PartyAlias) : party;
  }

  private bankAccountKey(bankParty: string, ownerParty: string): unknown {
    return BANK_ACCOUNT_TEMPLATE.keyEncode({
      _1: bankParty,
      _2: ownerParty,
    });
  }

  private commandId(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
  }
}
