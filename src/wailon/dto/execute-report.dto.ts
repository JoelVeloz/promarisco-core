import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { REPORT_LABELS, ReportType } from '../enums/report-type.enum';

import { ApiProperty } from '@nestjs/swagger';

export class ExecuteReportDto {
  @ApiProperty({ description: 'Tipo de reporte', enum: ReportType, example: ReportType.CAMARONERAS, required: false, default: ReportType.CAMARONERAS })
  @IsEnum(ReportType, {
    message:
      'El tipo de reporte debe ser un valor válido. Valores permitidos: ' +
      Object.entries(REPORT_LABELS)
        .map(([value, label]) => `${label.name} (${value})`)
        .join(', '),
  })
  @IsOptional()
  tipoReporte: ReportType;

  @ApiProperty({ description: 'Fecha desde (ISO 8601)', example: '2025-12-04T00:00:00' })
  @IsISO8601()
  fechaDesde: string;

  @ApiProperty({ description: 'Fecha hasta (ISO 8601)', example: '2025-12-04T23:59:59' })
  @IsISO8601()
  fechaHasta: string;
}
