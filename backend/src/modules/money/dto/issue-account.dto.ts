import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  PARTY_ALIASES,
  type IssueAccountRequest,
  type PartyAlias,
} from '@canton-demo/shared/demo-money';

export class IssueAccountDto implements IssueAccountRequest {
  @IsIn(PARTY_ALIASES)
  owner!: PartyAlias;

  @IsString()
  @IsNotEmpty()
  initialBalance!: string;
}
