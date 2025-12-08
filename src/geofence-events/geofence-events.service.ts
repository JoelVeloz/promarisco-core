import { GeofenceEventGroup, GeofenceZoneGroup, TransformedPayload, ZoneTime } from './types/geofence-event.types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { GeofenceEvent } from '@prisma/client';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { PrismaService } from '../prisma/prisma.service';
import { WailonService } from 'src/wailon/wailon.service';
import { transformPayload } from './utils/payload-transform.utils';

interface GetAllFilters {
  unit?: string;
  startTime?: string;
  endTime?: string;
  name?: string;
  zone?: string;
  group?: string;
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
    // this.logger.log('Iniciando proceso de generación de transformed para eventos sin transformar...');
    // this.generateTransformedForMissingEvents();
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
      // ultimos 100 datos
      let events = (rawEvents as unknown as any[]).slice(0, 100);

      events = Array.isArray(rawEvents) ? rawEvents : [];

      if (events.length === 0) {
        this.logger.log('No hay eventos sin transformed. Proceso completado.');
        return;
      }

      this.logger.log(`Encontrados ${events.length} eventos sin transformed. Iniciando procesamiento en paralelo...`);

      const processEvent = async (rawEvent: any) => {
        try {
          const eventId = (rawEvent as any)._id?.$oid || (rawEvent as any)._id || (rawEvent as any).id;

          if (!eventId) {
            this.logger.warn('Evento sin ID válido, saltando...');
            return { success: false, error: 'ID inválido' };
          }

          const payload = (rawEvent as any).payload;
          if (!payload) {
            this.logger.warn(`Evento ${eventId} sin payload, saltando...`);
            return { success: false, error: 'Sin payload' };
          }

          const transformed = transformPayload(payload);
          if (transformed && Object.keys(transformed).length > 0) {
            await this.prisma.geofenceEvent.update({
              where: { id: eventId },
              data: { transformed: transformed as any },
            });
            this.logger.debug(`Evento ${eventId} procesado correctamente. UNIT: ${transformed.UNIT || 'N/A'}`);
            return { success: true, unit: transformed.UNIT };
          } else {
            this.logger.warn(`Evento ${eventId} no pudo ser transformado. Payload vacío o formato inválido.`);
            return { success: false, error: 'Transformación fallida' };
          }
        } catch (error) {
          this.logger.error(`Error procesando evento:`, error);
          return { success: false, error: error.message };
        }
      };

      // Procesar en paralelo con límite de concurrencia
      const concurrency = 200; // Número de eventos a procesar simultáneamente
      let processed = 0;
      let errors = 0;

      // Dividir eventos en chunks
      for (let i = 0; i < events.length; i += concurrency) {
        const chunk = events.slice(i, i + concurrency);
        const results = await Promise.all(chunk.map((event) => processEvent(event)));

        results.forEach((result) => {
          if (result.success) {
            processed++;
          } else {
            errors++;
          }
        });

        // Mostrar progreso cada chunk
        const progress = Math.min(i + concurrency, events.length);
        this.logger.log(`Progreso: ${progress}/${events.length} eventos procesados (${processed} exitosos, ${errors} errores)`);
      }

      this.logger.log(`Proceso completado. Procesados: ${processed}, Errores: ${errors}, Total: ${events.length}`);
    } catch (error) {
      this.logger.error('Error en el proceso de generación de transformed:', error);
    }
  }

  async groupByName(filters?: GetAllFilters): Promise<GeofenceEventGroup[]> {
    const result = await this.prisma.geofenceEvent.aggregateRaw({
      pipeline: [{ $group: { _id: '$name', count: { $sum: 1 } } }, { $project: { name: '$_id', count: 1, _id: 0 } }],
    });

    return result as unknown as GeofenceEventGroup[];
  }

  async groupByZone(filters?: GetAllFilters): Promise<GeofenceEventGroup[]> {
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
  async getZoneTimes(filters?: GetAllFilters): Promise<[]> {
    const docs = (await this.prisma.$runCommandRaw({
      aggregate: 'report_zones',
      pipeline: [{ $sort: { entryTime: -1 } }, { $limit: 20000 }],
      cursor: { batchSize: 20000 },
    })) as any;

    const allDocs = docs.cursor?.firstBatch || [];
    console.log(`Total documentos cargados: ${allDocs.length}`);

    return allDocs.map((d: any) => ({
      unit: d.unit,
      zone: d.zone,
      group: d.group,
      entryTime: d.entryTime?.$date,
      exitTime: d.exitTime?.$date,
    }));
  }

  async getAll(filters?: GetAllFilters): Promise<PaginationResult<GeofenceEvent>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Construir el pipeline de agregación con filtros
    const pipeline: any[] = [];

    // Aplicar filtros en el pipeline
    const matchConditions: any = {};

    if (filters?.unit) {
      matchConditions.unit = filters.unit;
    }

    if (filters?.zone) {
      matchConditions.zone = filters.zone;
    }

    if (filters?.group) {
      matchConditions.group = filters.group;
    }

    // Filtrar por fechas usando entryTime
    if (filters?.startTime || filters?.endTime) {
      matchConditions.entryTime = {};
      if (filters.startTime) {
        matchConditions.entryTime.$gte = new Date(filters.startTime);
      }
      if (filters.endTime) {
        matchConditions.entryTime.$lte = new Date(filters.endTime);
      }
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Ordenar por entryTime descendente
    pipeline.push({ $sort: { entryTime: -1 } });

    // Contar total antes de paginar
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = (await this.prisma.$runCommandRaw({
      aggregate: 'report_zones',
      pipeline: countPipeline,
      cursor: { batchSize: 1 },
    })) as any;

    const total = countResult.cursor?.firstBatch?.[0]?.total || 0;

    // Aplicar paginación
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Ejecutar la consulta
    const docs = (await this.prisma.$runCommandRaw({
      aggregate: 'report_zones',
      pipeline: pipeline,
      cursor: { batchSize: limit },
    })) as any;

    const allDocs = docs.cursor?.firstBatch || [];

    // Transformar los documentos de la vista a formato GeofenceEvent
    const paginatedEvents = allDocs.map((d: any) => {
      // Construir el objeto transformed basado en los datos de la vista
      const transformed: TransformedPayload = {
        UNIT: d.unit,
        ZONE: d.zone,
        GRUPO_GEOCERCA: d.group,
      };

      // Usar entryTime como POS_TIME_UTC si está disponible
      if (d.entryTime) {
        const entryDate = d.entryTime?.$date ? new Date(d.entryTime.$date) : d.entryTime;
        transformed.POS_TIME_UTC = entryDate.toISOString();
      }

      // Crear un objeto GeofenceEvent compatible
      const entryDate = d.entryTime?.$date ? new Date(d.entryTime.$date) : d.entryTime || new Date();
      const exitDate = d.exitTime?.$date ? new Date(d.exitTime.$date) : d.exitTime || new Date();

      return {
        id: d._id?.$oid || d._id || '',
        name: filters?.name || 'ENTRADA_GEOCERCA', // Usar el filtro name si existe, sino un valor por defecto
        payload: null,
        transformed: transformed as any,
        createdAt: entryDate,
        updatedAt: exitDate,
      } as GeofenceEvent;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedEvents,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
