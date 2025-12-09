import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindAllReportsDto } from './dto/find-all-reports.dto';
import { ReportsService } from './reports.service';
import { geofenceEventResponseSchema } from './schemas/geofence-event.schema';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos' })
  @ApiResponse({ status: 200, schema: geofenceEventResponseSchema })
  async getAll(@Query() query: FindAllReportsDto): Promise<any[]> {
    return this.reportsService.getAll(query);
  }
}
