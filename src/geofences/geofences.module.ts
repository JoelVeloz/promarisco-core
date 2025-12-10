import { GeofencesController } from './geofences.controller';
import { GeofencesService } from './geofences.service';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [PrismaModule, ReportsModule],
  controllers: [GeofencesController],
  providers: [GeofencesService],
  exports: [GeofencesService],
})
export class GeofencesModule {}
