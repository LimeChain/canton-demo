import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { MoneyModule } from './modules/money/money.module';
import { PartiesModule } from './modules/parties/parties.module';
import { PqsModule } from './modules/pqs/pqs.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    PartiesModule,
    PqsModule,
    LedgerModule,
    MoneyModule,
  ],
})
export class AppModule {}
