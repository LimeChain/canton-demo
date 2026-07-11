import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PartiesModule } from '../parties/parties.module';
import { PqsModule } from '../pqs/pqs.module';
import { MoneyController } from './money.controller';
import { MoneyService } from './money.service';

@Module({
  imports: [AuthModule, LedgerModule, PartiesModule, PqsModule],
  controllers: [MoneyController],
  providers: [MoneyService],
})
export class MoneyModule {}
