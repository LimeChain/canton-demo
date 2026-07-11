import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  PARTY_ALIASES,
  type AdjustBalanceRequest,
  type BalanceAdjustmentType,
  type PartyAlias,
} from '@canton-demo/shared/demo-money';

const BALANCE_ADJUSTMENT_TYPES = ['Credit', 'Debit'] as const;

export class AdjustBalanceDto implements AdjustBalanceRequest {
  @IsIn(PARTY_ALIASES)
  owner!: PartyAlias;

  @IsIn(BALANCE_ADJUSTMENT_TYPES)
  adjustmentType!: BalanceAdjustmentType;

  @IsString()
  @IsNotEmpty()
  amount!: string;
}
