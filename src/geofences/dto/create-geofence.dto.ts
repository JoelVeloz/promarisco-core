import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateGeofenceDto {
  @ApiProperty({ description: 'Zone group name', example: 'ZONE_GROUP_1' })
  @IsNotEmpty({ message: 'groupName is required' })
  @IsString({ message: 'groupName must be a string' })
  groupName: string;

  @ApiProperty({ description: 'Array of geofences', example: ['geofence1', 'geofence2'] })
  @IsNotEmpty({ message: 'geofences is required' })
  @IsArray({ message: 'geofences must be an array' })
  geofences: any[];
}
