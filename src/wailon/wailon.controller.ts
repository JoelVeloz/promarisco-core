import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WailonService } from './wailon.service';
import { ExecuteReportDto } from './dto/execute-report.dto';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';

@ApiTags('Wailon')
@Controller('wailon')
@OptionalAuth()
export class WailonController {
  constructor(private readonly wailonService: WailonService) {}

  @Get('reports')
  @ApiOperation({ summary: 'Ejecutar reporte de Wialon' })
  @ApiResponse({ status: 200, description: 'Reporte ejecutado exitosamente' })
  async reports(@Query() query: ExecuteReportDto) {
    return this.wailonService.ejecutarReporteCompleto(query);
  }
}
