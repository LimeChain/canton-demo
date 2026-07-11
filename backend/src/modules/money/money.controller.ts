import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  DEMO_MONEY_ROUTE_ACCOUNTS,
  DEMO_MONEY_ROUTE_ACCOUNT_BY_OWNER,
  DEMO_MONEY_ROUTE_ADJUST_BALANCE,
  DEMO_MONEY_ROUTE_ISSUE_ACCOUNT,
  DEMO_MONEY_ROUTE_ME,
  DEMO_MONEY_ROUTE_PENDING_TRANSFERS,
  DEMO_MONEY_ROUTE_PROCESS_TRANSFERS,
  DEMO_MONEY_ROUTE_REQUEST_TRANSFER,
  isPartyAlias,
  type AccountDto,
  type ActorSessionDto,
  type PendingTransferDto,
  type ProcessPendingTransfersResponse,
} from '@canton-demo/shared/demo-money';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { IssueAccountDto } from './dto/issue-account.dto';
import { RequestTransferDto } from './dto/request-transfer.dto';
import {
  UnknownDemoPartyException,
  VisibleAccountNotFoundException,
} from './money.exception';
import { MoneyService } from './money.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class MoneyController {
  constructor(private readonly moneyService: MoneyService) {}

  @Get(DEMO_MONEY_ROUTE_ME)
  me(@CurrentUser() user: AuthenticatedUser): Promise<ActorSessionDto> {
    return this.moneyService.getMe(user.actor);
  }

  @Get(DEMO_MONEY_ROUTE_ACCOUNTS)
  accounts(@CurrentUser() user: AuthenticatedUser): Promise<AccountDto[]> {
    return this.moneyService.getVisibleAccounts(user.actor);
  }

  @Get(DEMO_MONEY_ROUTE_ACCOUNT_BY_OWNER)
  async account(
    @CurrentUser() user: AuthenticatedUser,
    @Param('owner') owner: string,
  ): Promise<AccountDto> {
    if (!isPartyAlias(owner)) {
      throw new UnknownDemoPartyException();
    }

    const account = await this.moneyService.getVisibleAccountByOwner(
      user.actor,
      owner,
    );
    if (!account) {
      throw new VisibleAccountNotFoundException(owner);
    }

    return account;
  }

  @Get(DEMO_MONEY_ROUTE_PENDING_TRANSFERS)
  pendingTransfers(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PendingTransferDto[]> {
    return this.moneyService.getPendingTransfers(user.actor);
  }

  @Post(DEMO_MONEY_ROUTE_REQUEST_TRANSFER)
  requestTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RequestTransferDto,
  ): Promise<unknown> {
    return this.moneyService.requestTransfer(user, body.receiver, body.amount);
  }

  @Post(DEMO_MONEY_ROUTE_ISSUE_ACCOUNT)
  issueAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: IssueAccountDto,
  ): Promise<unknown> {
    return this.moneyService.issueAccount(user, body.owner, body.initialBalance);
  }

  @Post(DEMO_MONEY_ROUTE_ADJUST_BALANCE)
  adjustBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AdjustBalanceDto,
  ): Promise<unknown> {
    return this.moneyService.adjustBalance(
      user,
      body.owner,
      body.adjustmentType,
      body.amount,
    );
  }

  @Post(DEMO_MONEY_ROUTE_PROCESS_TRANSFERS)
  processTransfers(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProcessPendingTransfersResponse> {
    return this.moneyService.processPendingTransfers(user);
  }
}
