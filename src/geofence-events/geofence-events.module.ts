import { GeofenceEventsController } from './geofence-events.controller';
import { GeofenceEventsService } from './geofence-events.service';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GeofenceEventsController],
  providers: [GeofenceEventsService],
})
export class GeofenceEventsModule {}
