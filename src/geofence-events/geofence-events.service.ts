import { GeofenceEventGroup, GeofenceZoneGroup, TransformedPayload, ZoneTime } from './types/geofence-event.types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { GeofenceEvent } from '@prisma/client';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { PrismaService } from '../prisma/prisma.service';
import { transformPayload } from './utils/payload-transform.utils';

interface GetAllFilters {
  unit?: string;
  startTime?: string;
  endTime?: string;
  name?: string;
  zone?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class GeofenceEventsService implements OnModuleInit {
  private readonly logger = new Logger(GeofenceEventsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // de todos limpia el campo transformed
    // await this.prisma.geofenceEvent.updateMany({
    //   data: { transformed: null },
    // });
    this.logger.log('Iniciando proceso de generación de transformed para eventos sin transformar...');
    this.generateTransformedForMissingEvents();
  }

  private async generateTransformedForMissingEvents(): Promise<void> {
    try {
      const rawEvents = await this.prisma.geofenceEvent.aggregateRaw({
        pipeline: [
          {
            $match: {
              $or: [{ transformed: null }, { transformed: { $exists: false } }, { transformed: {} }],
            },
          },
        ],
      });

      const events = Array.isArray(rawEvents) ? rawEvents : [];

      if (events.length === 0) {
        this.logger.log('No hay eventos sin transformed. Proceso completado.');
        return;
      }

      this.logger.log(`Encontrados ${events.length} eventos sin transformed. Iniciando procesamiento...`);

      let processed = 0;
      let errors = 0;

      for (const rawEvent of events) {
        try {
          const eventId = (rawEvent as any)._id?.$oid || (rawEvent as any)._id || (rawEvent as any).id;

          if (!eventId) {
            this.logger.warn('Evento sin ID válido, saltando...');
            errors++;
            continue;
          }

          const payload = (rawEvent as any).payload;
          if (!payload) {
            this.logger.warn(`Evento ${eventId} sin payload, saltando...`);
            errors++;
            continue;
          }

          const transformed = transformPayload(payload);
          if (transformed && Object.keys(transformed).length > 0) {
            await this.prisma.geofenceEvent.update({
              where: { id: eventId },
              data: { transformed: transformed as any },
            });
            processed++;
            this.logger.debug(`Evento ${eventId} procesado correctamente. UNIT: ${transformed.UNIT || 'N/A'}`);
          } else {
            this.logger.warn(`Evento ${eventId} no pudo ser transformado. Payload vacío o formato inválido.`);
            errors++;
          }
        } catch (error) {
          this.logger.error(`Error procesando evento:`, error);
          errors++;
        }
      }

      this.logger.log(`Proceso completado. Procesados: ${processed}, Errores: ${errors}, Total: ${events.length}`);
    } catch (error) {
      this.logger.error('Error en el proceso de generación de transformed:', error);
    }
  }

  async groupByName(): Promise<GeofenceEventGroup[]> {
    const result = await this.prisma.geofenceEvent.aggregateRaw({
      pipeline: [{ $group: { _id: '$name', count: { $sum: 1 } } }, { $project: { name: '$_id', count: 1, _id: 0 } }],
    });

    return result as unknown as GeofenceEventGroup[];
  }

  async groupByZone(): Promise<GeofenceEventGroup[]> {
    const result = await this.prisma.geofenceEvent.aggregateRaw({
      pipeline: [
        {
          $match: {
            'transformed.ZONE': { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$transformed.ZONE',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            name: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ],
    });

    return result as unknown as GeofenceEventGroup[];
  }

  async getZoneTimes(): Promise<ZoneTime[]> {
    const docs = (await this.prisma.$runCommandRaw({
      aggregate: 'zone_times',
      pipeline: [{ $sort: { entryTime: -1 } }, { $limit: 20000 }],
      cursor: { batchSize: 2000 },
    })) as any;

    const allDocs = docs.cursor?.firstBatch || [];
    console.log(`Total documentos cargados: ${allDocs.length}`);

    return allDocs.map((d: any) => ({
      unit: d.unit,
      zone: d.zone,
      entryTime: d.entryTime?.$date,
      exitTime: d.exitTime?.$date,
    }));
  }

  async getAll(filters?: GetAllFilters): Promise<PaginationResult<GeofenceEvent>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.prisma.geofenceEvent.findMany();

    let filteredEvents = events;

    if (filters && (filters.unit || filters.startTime || filters.endTime || filters.name || filters.zone)) {
      filteredEvents = events.filter((event) => {
        if (filters.name && event.name !== filters.name) {
          return false;
        }

        const transformed = event.transformed as TransformedPayload | null;

        if (!transformed) {
          return false;
        }

        if (filters.unit && transformed.UNIT !== filters.unit) {
          return false;
        }

        if (filters.zone && transformed.ZONE !== filters.zone) {
          return false;
        }

        if (filters.startTime || filters.endTime) {
          const posTimeUTC = transformed.POS_TIME_UTC;
          if (!posTimeUTC) {
            return false;
          }

          if (filters.startTime && posTimeUTC < new Date(filters.startTime)) {
            return false;
          }

          if (filters.endTime && posTimeUTC > new Date(filters.endTime)) {
            return false;
          }
        }

        return true;
      });
    }

    const total = filteredEvents.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedEvents = filteredEvents.slice(skip, skip + limit);

    return {
      data: paginatedEvents,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
