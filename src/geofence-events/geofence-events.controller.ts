import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { GeofenceEventGroup, ZoneTime } from './types/geofence-event.types';
import { GeofenceEvent } from '@prisma/client';
import { GeofenceEventsService } from './geofence-events.service';
import { geofenceEventGroupResponseSchema } from './schemas/geofence-event-group.schema';
import { geofenceEventResponseSchema } from './schemas/geofence-event.schema';
import { zoneTimeResponseSchema } from './schemas/zone-time.schema';
import { FindAllGeofenceEventsDto } from './dto/find-all-geofence-events.dto';

@ApiTags('Geofence Events')
@Controller('geofence-events')
export class GeofenceEventsController {
  constructor(private readonly geofenceEventsService: GeofenceEventsService) {}

  @Get('grouped-by-name')
  @ApiOperation({ summary: 'Eventos agrupados por nombre' })
  @ApiResponse({ status: 200, schema: geofenceEventGroupResponseSchema })
  async getGroupedByName(): Promise<GeofenceEventGroup[]> {
    return this.geofenceEventsService.groupByName();
  }

  @Get('grouped-by-zone')
  @ApiOperation({ summary: 'Eventos agrupados por zona' })
  @ApiResponse({ status: 200, schema: geofenceEventGroupResponseSchema })
  async getGroupedByZone(): Promise<GeofenceEventGroup[]> {
    return this.geofenceEventsService.groupByZone();
  }

  @Get('zone-times')
  @ApiOperation({ summary: 'Tiempos de permanencia por zona y unidad (viajes)' })
  @ApiResponse({ status: 200, schema: zoneTimeResponseSchema })
  async getZoneTimes(): Promise<ZoneTime[]> {
    return this.geofenceEventsService.getZoneTimes();
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos' })
  @ApiResponse({ status: 200, schema: geofenceEventResponseSchema })
  async getAll(@Query() query: FindAllGeofenceEventsDto): Promise<GeofenceEvent[]> {
    return this.geofenceEventsService.getAll(query);
  }
}
