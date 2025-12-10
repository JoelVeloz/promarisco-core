import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateGeofenceDto } from './dto/create-geofence.dto';
import { FindAllGeofencesDto } from './dto/find-all-geofences.dto';
import { Geofence } from '@prisma/client';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { UpdateGeofenceDto } from './dto/update-geofence.dto';

@Injectable()
export class GeofencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService
  ) {}

  async create(createGeofenceDto: CreateGeofenceDto): Promise<Geofence> {
    try {
      // Verificar si ya existe un geofence con el mismo groupName
      const existingGeofence = await this.prisma.geofence.findFirst({ where: { groupName: createGeofenceDto.groupName } });

      if (existingGeofence) {
        throw new ConflictException(`A geofence with groupName ${createGeofenceDto.groupName} already exists`);
      }

      const geofence = await this.prisma.geofence.create({
        data: {
          groupName: createGeofenceDto.groupName,
          geofences: createGeofenceDto.geofences,
        },
      });

      // Invalidar caché de reports cuando se crea una geocerca
      await this.reportsService.invalidateCache();

      return geofence;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Error creating geofence: ${error.message}`);
    }
  }

  async findAll(query: FindAllGeofencesDto): Promise<PaginationResult<Geofence>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      this.prisma.geofence.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.geofence.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<Geofence> {
    const geofence = await this.prisma.geofence.findUnique({
      where: { id },
    });

    if (!geofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }

    return geofence;
  }

  async update(id: string, updateGeofenceDto: UpdateGeofenceDto): Promise<Geofence> {
    // Verificar que el geofence existe
    const existingGeofence = await this.prisma.geofence.findUnique({ where: { id } });

    if (!existingGeofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }

    // Si se está actualizando el groupName, verificar que no esté en uso
    if (updateGeofenceDto.groupName && updateGeofenceDto.groupName !== existingGeofence.groupName) {
      const groupNameInUse = await this.prisma.geofence.findFirst({
        where: { groupName: updateGeofenceDto.groupName },
      });

      if (groupNameInUse) {
        throw new ConflictException(`A geofence with groupName ${updateGeofenceDto.groupName} already exists`);
      }
    }

    // Actualizar usando Prisma
    const updatedGeofence = await this.prisma.geofence.update({
      where: { id },
      data: {
        ...(updateGeofenceDto.groupName && { groupName: updateGeofenceDto.groupName }),
        ...(updateGeofenceDto.geofences && { geofences: updateGeofenceDto.geofences }),
      },
    });

    // Invalidar caché de reports cuando se actualiza una geocerca
    // Esto asegura que los reports reflejen los cambios en las geocercas
    await this.reportsService.invalidateCache();

    return updatedGeofence;
  }

  async remove(id: string): Promise<void> {
    // Verificar que el geofence existe
    const existingGeofence = await this.prisma.geofence.findUnique({ where: { id } });
    if (!existingGeofence) {
      throw new NotFoundException(`Geofence with ID ${id} not found`);
    }

    await this.prisma.geofence.delete({ where: { id } });

    // Invalidar caché de reports cuando se elimina una geocerca
    await this.reportsService.invalidateCache();
  }
}
