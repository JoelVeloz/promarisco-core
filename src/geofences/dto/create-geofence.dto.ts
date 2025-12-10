import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateGeofenceDto {
  @ApiProperty({ description: 'Zone group name', example: 'ZONE_GROUP_1' })
  @IsNotEmpty({ message: 'groupName is required' })
  @IsString({ message: 'groupName must be a string' })
  groupName: string;

  @ApiProperty({ description: 'Array of geofences', example: ['geofence1', 'geofence2'] })
  @IsNotEmpty({ message: 'geofences is required' })
  @IsArray({ message: 'geofences must be an array' })
  geofences: any[];

  @ApiProperty({
    description: 'Minimum travel time in minutes',
    example: 30,
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minimumTravelTime must be an integer' })
  @Min(0, { message: 'minimumTravelTime must be greater than or equal to 0' })
  minimumTravelTime?: number = 0;

  @ApiProperty({
    description: 'Minimum time between trips in minutes',
    example: 60,
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minimumTimeBetweenTrips must be an integer' })
  @Min(0, { message: 'minimumTimeBetweenTrips must be greater than or equal to 0' })
  minimumTimeBetweenTrips?: number = 0;
}
