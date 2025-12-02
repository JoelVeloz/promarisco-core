import { IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class FindAllGeofenceEventsDto {
  @ApiProperty({
    required: false,
    description: 'Filtrar por unidad',
    example: 'PM020',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    required: false,
    description: 'Fecha inicio (ISO UTC)',
    example: '2025-12-02T08:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({
    required: false,
    description: 'Fecha fin (ISO UTC)',
    example: '2025-12-02T09:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    required: false,
    description: 'Filtrar por nombre del evento',
    example: 'ENTRADA_GEOCERCA',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'Filtrar por zona',
    example: 'PROMARISCO-DURAN',
  })
  @IsOptional()
  @IsString()
  zone?: string;
}
