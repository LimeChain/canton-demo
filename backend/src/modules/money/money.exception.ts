import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PartyAlias } from '@canton-demo/shared/demo-money';

export class UnknownDemoPartyException extends BadRequestException {
  constructor() {
    super('unknown demo party');
  }
}

export class VisibleAccountNotFoundException extends NotFoundException {
  constructor(owner: PartyAlias) {
    super(`No visible BankAccount for ${owner}`);
  }
}

export class MissingSenderAccountException extends BadRequestException {
  constructor(actor: PartyAlias) {
    super(`Logged-in party "${actor}" has no visible BankAccount to send from.`);
  }
}

export class VisibleAccountDirectoryNotFoundException extends NotFoundException {
  constructor() {
    super('No visible BankAccountDirectory for the logged-in party.');
  }
}
