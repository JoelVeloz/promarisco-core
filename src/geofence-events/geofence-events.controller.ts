import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { GeofenceEventGroup } from './types/geofence-event.types';
import { GeofenceEvent } from '@prisma/client';
import { GeofenceEventsService } from './geofence-events.service';
import { geofenceEventGroupResponseSchema } from './schemas/geofence-event-group.schema';
import { geofenceEventResponseSchema } from './schemas/geofence-event.schema';
import { FindAllGeofenceEventsDto } from './dto/find-all-geofence-events.dto';

@ApiTags('Geofence Events')
@Controller('geofence-events')
export class GeofenceEventsController {
  constructor(private readonly geofenceEventsService: GeofenceEventsService) {}

  @Get('grouped-by-name')
  @ApiOperation({ summary: 'Eventos agrupados' })
  @ApiResponse({ status: 200, schema: geofenceEventGroupResponseSchema })
  async getGroupedByName(): Promise<GeofenceEventGroup[]> {
    return this.geofenceEventsService.groupByName();
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos' })
  @ApiResponse({ status: 200, schema: geofenceEventResponseSchema })
  async getAll(@Query() query: FindAllGeofenceEventsDto): Promise<GeofenceEvent[]> {
    return this.geofenceEventsService.getAll(query);
  }
}
