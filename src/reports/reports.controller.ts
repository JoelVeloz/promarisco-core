import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindAllReportsDto } from './dto/find-all-reports.dto';
import { ReportsService } from './reports.service';
import { geofenceEventResponseSchema } from './schemas/geofence-event.schema';

@ApiTags('Reports')
@Controller('reports')
@UseInterceptors(CacheInterceptor)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @CacheTTL(5 * 60 * 1000)
  @ApiOperation({ summary: 'Listar eventos' })
  @ApiResponse({ status: 200, schema: geofenceEventResponseSchema })
  async getAll(@Query() query: FindAllReportsDto): Promise<any[]> {
    const startTime = Date.now();
    this.logger.log(`[CACHE] Request recibido - Query params: ${JSON.stringify(query)}`);

    const result = await this.reportsService.getAll(query);

    const duration = Date.now() - startTime;
    this.logger.log(`[CACHE] Response enviado en ${duration}ms - Si es < 50ms probablemente fue cacheado`);

    return result;
  }
}
