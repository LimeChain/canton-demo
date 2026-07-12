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
