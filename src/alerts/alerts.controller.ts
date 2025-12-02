import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Alert } from '@prisma/client';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { AlertsService } from './alerts.service';
import { FindAllAlertsDto } from './dto/find-all-alerts.dto';

@ApiTags('Alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alertas' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: FindAllAlertsDto): Promise<PaginationResult<Alert>> {
    return this.alertsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener alerta' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string): Promise<Alert | null> {
    return this.alertsService.findOne(id);
  }
}
