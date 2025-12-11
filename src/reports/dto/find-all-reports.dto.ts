import { IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FindAllReportsDto {
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

  @ApiProperty({
    required: false,
    description: 'Filtrar por grupo',
    example: 'CAMARONERAS',
  })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({
    required: false,
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    required: false,
    description: 'Cantidad de elementos por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}



