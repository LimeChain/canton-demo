import { Module } from '@nestjs/common';
import { PqsRepository } from './pqs.repository';

@Module({
  providers: [PqsRepository],
  exports: [PqsRepository],
})
export class PqsModule {}
