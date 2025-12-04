import { AlertsModule } from './alerts/alerts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GeofenceEventsModule } from './geofence-events/geofence-events.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, AlertsModule, WebhooksModule, GeofenceEventsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
