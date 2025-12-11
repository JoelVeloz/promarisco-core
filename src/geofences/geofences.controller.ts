import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Geofence } from '@prisma/client';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { CreateGeofenceDto } from './dto/create-geofence.dto';
import { FindAllGeofencesDto } from './dto/find-all-geofences.dto';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';
import { GeofencesService } from './geofences.service';

@Controller('geofences')
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new geofence' })
  @ApiResponse({ status: 201, description: 'Geofence created successfully' })
  @ApiResponse({ status: 409, description: 'Geofence with this ngroupGame already exists' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(@Body() createGeofenceDto: CreateGeofenceDto): Promise<Geofence> {
    return this.geofencesService.create(createGeofenceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all geofences' })
  @ApiResponse({ status: 200, description: 'List of geofences obtained successfully' })
  async findAll(@Query() query: FindAllGeofencesDto): Promise<PaginationResult<Geofence>> {
    return this.geofencesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a geofence by ID' })
  @ApiResponse({ status: 200, description: 'Geofence found' })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  async findOne(@Param('id') id: string): Promise<Geofence> {
    return this.geofencesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a geofence' })
  @ApiResponse({ status: 200, description: 'Geofence updated successfully' })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  @ApiResponse({ status: 409, description: 'A geofence with this ngroupGame already exists' })
  async update(@Param('id') id: string, @Body() updateGeofenceDto: UpdateGeofenceDto): Promise<Geofence> {
    return this.geofencesService.update(id, updateGeofenceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a geofence' })
  @ApiResponse({ status: 204, description: 'Geofence deleted successfully' })
  @ApiResponse({ status: 404, description: 'Geofence not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.geofencesService.remove(id);
  }
}
