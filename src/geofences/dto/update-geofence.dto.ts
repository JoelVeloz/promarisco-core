import { IsArray, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateGeofenceDto {
  @ApiProperty({ description: 'Zone group name', example: 'ZONE_GROUP_1', required: false })
  @IsOptional()
  @IsString({ message: 'ngroupGame must be a string' })
  ngroupGame?: string;

  @ApiProperty({ description: 'Array of geofences', example: ['geofence1', 'geofence2'], required: false })
  @IsOptional()
  @IsArray({ message: 'geofences must be an array' })
  geofences?: any[];
}
