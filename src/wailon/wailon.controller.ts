import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { WailonReportsService } from './wailon-reports.service';
import { IsISO8601 } from 'class-validator';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';

class ExecuteReportQueryDto {
  @ApiProperty({ description: 'Fecha desde (ISO 8601)', example: '2025-12-04T00:00:00' })
  @IsISO8601()
  fechaDesde: string;

  @ApiProperty({ description: 'Fecha hasta (ISO 8601)', example: '2025-12-04T23:59:59' })
  @IsISO8601()
  fechaHasta: string;
}

@ApiTags('Wailon')
@Controller('wailon')
@OptionalAuth()
export class WailonController {
  constructor(private readonly wailonReportsService: WailonReportsService) {}

  @Get('reports')
  @ApiOperation({ summary: 'Ejecutar reporte de Wialon' })
  @ApiResponse({ status: 200, description: 'Reporte ejecutado exitosamente' })
  async reports(@Query() query: ExecuteReportQueryDto) {
    return this.wailonReportsService.ejecutarReporteDeUnidades(query);
  }
}
