import { Injectable } from '@nestjs/common';

const HEALTH_SERVICE_NAME = 'canton-demo-backend';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: HEALTH_SERVICE_NAME,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
