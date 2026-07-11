import { ValidationPipe } from '@nestjs/common';

export const AppValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});
