import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { GeofenceEventGroup } from './types/geofence-event.types';
import { GeofenceEvent } from '@prisma/client';
import { GeofenceEventsService } from './geofence-events.service';
import { geofenceEventGroupResponseSchema } from './schemas/geofence-event-group.schema';
import { geofenceEventResponseSchema } from './schemas/geofence-event.schema';

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
  @ApiQuery({ name: 'unit', required: false, description: 'Filtrar por unidad' })
  @ApiQuery({ name: 'startTime', required: false, description: 'Fecha inicio (ISO UTC)', example: '2025-12-02T08:00:00.000Z' })
  @ApiQuery({ name: 'endTime', required: false, description: 'Fecha fin (ISO UTC)', example: '2025-12-02T09:00:00.000Z' })
  @ApiQuery({ name: 'name', required: false, description: 'Filtrar por nombre del evento' })
  @ApiQuery({ name: 'zone', required: false, description: 'Filtrar por zona' })
  @ApiResponse({ status: 200, schema: geofenceEventResponseSchema })
  async getAll(@Query() query: { unit?: string; startTime?: string; endTime?: string; name?: string; zone?: string }): Promise<GeofenceEvent[]> {
    return this.geofenceEventsService.getAll(query);
  }
}
