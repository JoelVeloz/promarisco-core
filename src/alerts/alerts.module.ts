import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { WebhookController } from './webhook.controller';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlertsController, WebhookController],
  providers: [AlertsService],
})
export class AlertsModule {}
