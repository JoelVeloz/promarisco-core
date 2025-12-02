import { GeofenceEventGroup, GeofenceZoneGroup, TransformedPayload, ZoneTime } from './types/geofence-event.types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { GeofenceEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { transformPayload } from './utils/payload-transform.utils';

interface GetAllFilters {
  unit?: string;
  startTime?: string;
  endTime?: string;
  name?: string;
  zone?: string;
}

@Injectable()
export class GeofenceEventsService implements OnModuleInit {
  private readonly logger = new Logger(GeofenceEventsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Iniciando proceso de generación de transformed para eventos sin transformar...');
    await this.generateTransformedForMissingEvents();
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

  private formatDateReadable(dateString: string | null): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  async getZoneTimes(): Promise<ZoneTime[]> {
    const result = await this.prisma.geofenceEvent.aggregateRaw({
      pipeline: [
        // --- Filtrar datos válidos ---
        {
          $match: {
            'transformed.UNIT': { $exists: true, $ne: null },
            'transformed.ZONE': { $exists: true, $ne: null },
            'transformed.POS_TIME_UTC': { $exists: true, $ne: null },
            name: { $in: ['ENTRADA_GEOCERCA', 'SALIDA_GEOCERCA'] },
          },
        },

        // --- Proyección limpia ---
        {
          $project: {
            unit: '$transformed.UNIT',
            zone: '$transformed.ZONE',
            eventType: '$name',
            time: '$transformed.POS_TIME_UTC',
          },
        },

        // --- Ordenar por unidad, zona, tiempo ---
        {
          $sort: { unit: 1, zone: 1, time: 1 },
        },

        // --- Agrupar por unit + zone ---
        {
          $group: {
            _id: { unit: '$unit', zone: '$zone' },
            events: { $push: '$$ROOT' },
          },
        },
      ],
    });

    const groupedResults = Array.isArray(result) ? result : [];
    const zoneTimes: ZoneTime[] = [];

    // Procesar reglas: entradas consecutivas / salidas consecutivas en Node.js
    for (const group of groupedResults) {
      const unit = (group as any)._id.unit;
      const zone = (group as any)._id.zone;
      const events = (group as any).events || [];

      let lastEntry: { eventType: string; time: string } | null = null;

      for (const e of events) {
        if (e.eventType === 'ENTRADA_GEOCERCA') {
          // Si hay una entrada pendiente sin salida, guardarla con exitTime null
          if (lastEntry) {
            zoneTimes.push({
              unit,
              zone,
              startTime: lastEntry.time,
              endTime: null,
              startTimeReadable: this.formatDateReadable(lastEntry.time),
              endTimeReadable: null,
              durationMinutes: null,
            });
          }
          // Entradas consecutivas → quedarse con la más reciente
          lastEntry = e;
          continue;
        }

        if (e.eventType === 'SALIDA_GEOCERCA') {
          if (lastEntry) {
            // Emparejar entrada con salida y calcular duración
            const startDate = new Date(lastEntry.time);
            const endDate = new Date(e.time);
            const durationSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
            const durationMinutes = Number((durationSeconds / 60).toFixed(2));

            zoneTimes.push({
              unit,
              zone,
              startTime: lastEntry.time,
              endTime: e.time,
              startTimeReadable: this.formatDateReadable(lastEntry.time),
              endTimeReadable: this.formatDateReadable(e.time),
              durationMinutes,
            });
            lastEntry = null; // Consumimos la entrada
          } else {
            // Salida sin entrada previa
            zoneTimes.push({
              unit,
              zone,
              startTime: null,
              endTime: e.time,
              startTimeReadable: null,
              endTimeReadable: this.formatDateReadable(e.time),
              durationMinutes: null,
            });
          }
        }
      }

      // Si queda una entrada sin salida
      if (lastEntry) {
        zoneTimes.push({
          unit,
          zone,
          startTime: lastEntry.time,
          endTime: null,
          startTimeReadable: this.formatDateReadable(lastEntry.time),
          endTimeReadable: null,
          durationMinutes: null,
        });
      }
    }

    return zoneTimes;
  }

  async getAll(filters?: GetAllFilters): Promise<GeofenceEvent[]> {
    const events = await this.prisma.geofenceEvent.findMany();

    if (!filters || (!filters.unit && !filters.startTime && !filters.endTime && !filters.name && !filters.zone)) {
      return events;
    }

    return events.filter((event) => {
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

        if (filters.startTime && posTimeUTC < filters.startTime) {
          return false;
        }

        if (filters.endTime && posTimeUTC > filters.endTime) {
          return false;
        }
      }

      return true;
    });
  }
}
