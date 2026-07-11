import { Module } from '@nestjs/common';

import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
