import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  PARTY_ALIASES,
  type PartyAlias,
  type RequestTransferRequest,
} from '@canton-demo/shared/demo-money';

export class RequestTransferDto implements RequestTransferRequest {
  @IsIn(PARTY_ALIASES)
  receiver!: PartyAlias;

  @IsString()
  @IsNotEmpty()
  amount!: string;
}
