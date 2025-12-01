import { Controller, Get, Param, Query } from '@nestjs/common';
import { Alert } from '@prisma/client';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { AlertsService } from './alerts.service';
import { FindAllAlertsDto } from './dto/find-all-alerts.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(@Query() query: FindAllAlertsDto): Promise<PaginationResult<Alert>> {
    return this.alertsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Alert | null> {
    return this.alertsService.findOne(id);
  }
}
