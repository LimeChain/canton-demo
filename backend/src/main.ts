import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { API_PREFIX } from '@canton-demo/shared';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { SERVER_CONFIG } from './config/demo.config';
import { AppValidationPipe } from './pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.enableCors({
    credentials: true,
    origin: SERVER_CONFIG.corsOrigin,
  });
  app.useGlobalPipes(AppValidationPipe);
  app.enableShutdownHooks();
  app.setGlobalPrefix(API_PREFIX);
  app.useLogger(logger);

  await app.listen(SERVER_CONFIG.port, SERVER_CONFIG.host);
  logger.log(`API started on ${SERVER_CONFIG.port} with prefix ${API_PREFIX}`);
}

void bootstrap();
