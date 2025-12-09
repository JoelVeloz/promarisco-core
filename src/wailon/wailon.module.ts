import { Module } from '@nestjs/common';
import { WailonController } from './wailon.controller';
import { WailonGeofencesService } from './wailon-geofences.service';
import { WailonReportsService } from './wailon-reports.service';
import { WailonService } from './wailon.service';

@Module({
  controllers: [WailonController],
  providers: [WailonService, WailonReportsService, WailonGeofencesService],
  exports: [WailonService, WailonReportsService, WailonGeofencesService],
})
export class WailonModule {}
