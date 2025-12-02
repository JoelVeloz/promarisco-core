import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { GeofenceEventGroup, GeofenceEventsService } from './geofence-events.service';

import { geofenceEventGroupResponseSchema } from './schemas/geofence-event-group.schema';

@ApiTags('Eventos de geocerca')
@Controller('geofence-events')
export class GeofenceEventsController {
  constructor(private readonly geofenceEventsService: GeofenceEventsService) {}

  @Get('grouped-by-name')
  @ApiOperation({ summary: 'Eventos agrupados por nombre' })
  @ApiResponse({ status: 200, description: 'Eventos agrupados', schema: geofenceEventGroupResponseSchema })
  async getGroupedByName(): Promise<GeofenceEventGroup[]> {
    return this.geofenceEventsService.groupByName();
  }
}
