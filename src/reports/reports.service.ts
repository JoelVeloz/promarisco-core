import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { PrismaService } from '../prisma/prisma.service';
import { obtenerZonaPorGeocerca } from 'src/wailon/utils/geocercas';

interface GetAllFilters {
  unit?: string;
  startTime?: string;
  endTime?: string;
  zone?: string;
  group?: string;
}
function formatDate(date: Date) {
  return date
    .toLocaleString('es-ES', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(',', '');
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly CACHE_TTL = 300000; // 5 minutos en milisegundos

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getAll(filters?: GetAllFilters): Promise<any[]> {
    const startTime = Date.now();

    // Generar clave única basada en los filtros
    const cacheKey = `reports:getAll:${JSON.stringify(filters || {})}`;

    // Intentar obtener del caché
    const cachedData = await this.cacheManager.get<any[]>(cacheKey);
    if (cachedData) {
      const duration = Date.now() - startTime;
      this.logger.log(`[CACHE HIT] Datos obtenidos del caché en ${duration}ms - ${cachedData.length} resultados`);
      return cachedData;
    }

    this.logger.log(`[CACHE MISS] Iniciando getAll con filtros: ${JSON.stringify(filters)}`);

    const matchConditions: any = {
      ...(filters?.unit && { unit: filters.unit }),
      ...(filters?.zone && { zone: filters.zone }),
      ...(filters?.group && { group: filters.group }),
      ...((filters?.startTime || filters?.endTime) && {
        entryTime: {
          ...(filters.startTime && { $gte: new Date(filters.startTime) }),
          ...(filters.endTime && { $lte: new Date(filters.endTime) }),
        },
      }),
    };

    const pipeline: any[] = [...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : [])];
    const docs = (await this.prisma.$runCommandRaw({
      aggregate: 'report_zones',
      pipeline,
      cursor: { batchSize: 20000 },
    })) as any;

    let result = docs.cursor?.firstBatch || [];

    // Guardar en caché
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    const duration = Date.now() - startTime;
    this.logger.log(`[CACHE SET] getAll completado en ${duration}ms - ${result.length} resultados - Guardado en caché`);

    // // ---------------------------------------------------------
    // // 1) Eliminar duplicados SOLO en completados (exitTime)
    // // ---------------------------------------------------------

    // const vistosCompletados = new Set<string>();

    // // filtrar solo completados
    // const completados = result.filter((d: any) => d.isCompleted);

    // const correcionCompletados = completados.filter((d: any) => {
    //   // Si NO está completado -> no aplicar lógica aquí
    //   if (!d.isCompleted) return true;

    //   const exitFormatted = formatDate(new Date(d.exitTime));
    //   if (vistosCompletados.has(exitFormatted)) {
    //     return false; // eliminar duplicado
    //   }
    //   vistosCompletados.add(exitFormatted);
    //   return true; // conservar el primero con ese exitTime
    // });

    // const latestNoCompleted = new Map<string, any>();

    // result.forEach((d: any) => {
    //   if (!d.isCompleted) {
    //     const prev = latestNoCompleted.get(d.unit);

    //     // Si no existe previo o este es más reciente → conservar este
    //     if (!prev || d.entryTime > prev.entryTime) {
    //       latestNoCompleted.set(d.unit, d);
    //     }
    //   }
    // });
    // // Resultado final solo no completados (sin duplicados por unidad)
    // const noCompletedFinal = Array.from(latestNoCompleted.values());

    return result;
  }
}
