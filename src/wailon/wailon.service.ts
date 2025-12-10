import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { WailonGeofencesService } from './wailon-geofences.service';
import { WailonReportsService } from './wailon-reports.service';

@Injectable()
export class WailonService {
  private readonly logger = new Logger(WailonService.name);

  constructor(
    private readonly wailonReportsService: WailonReportsService,
    private readonly wailonGeofencesService: WailonGeofencesService,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    // return;
    this.logger.log('Inicializando módulo Wailon - verificando reporte "NUEVO INFORME"...');

    try {
      // Verificar cantidad de registros del reporte "NUEVO INFORME"
      const cantidadRegistros = await this.prisma.wailonReport.count({ where: { name: 'NUEVO INFORME' } });

      this.logger.verbose(`Reporte "NUEVO INFORME" tiene ${cantidadRegistros} registros`);

      if (cantidadRegistros < 500) {
        this.logger.verbose('El reporte tiene menos de 500 registros. Cargando datos de los últimos 2 meses...');

        // Cargar datos de los últimos 2 meses
        const fechaDesde = DateTime.now().minus({ months: 2 }).toISO() as string;
        const fechaHasta = DateTime.now().toISO() as string;

        await this.wailonReportsService.ejecutarReporteDeUnidades({ fechaDesde, fechaHasta });

        this.logger.log('✓ Datos de los últimos 2 meses cargados exitosamente');
      } else {
        this.logger.log('El reporte tiene 500 o más registros. No se requiere carga inicial.');
      }

      // // Ejecutar reportes de geocercas por zonegroup (última semana, una vez por cada zonegroup)
      // this.logger.log('Ejecutando reportes de geocercas por zonegroup...');
      // await this.wailonGeofencesService.ejecutarReportesDeGeocercasPorZonegroup();

      this.logger.log('✓ Inicialización del módulo Wailon completada. Cron cada minuto activado.');
    } catch (error) {
      this.logger.error('Error al inicializar módulo Wailon:', error);
    }
  }

  // @Cron(CronExpression.EVERY_10_MINUTES)
  // async procesarReporteCadaMinuto() {
  //   this.logger.verbose('Ejecutando reporte de Wailon (cron cada minuto)...');

  //   try {
  //     // Obtener datos desde el último minuto hasta ahora
  //     const fechaDesde = DateTime.now().minus({ months: 1 }).toISO() as string;
  //     const fechaHasta = DateTime.now().toISO() as string;

  //     await this.wailonReportsService.ejecutarReporteDeUnidades({ fechaDesde, fechaHasta });

  //     this.logger.verbose('✓ Reporte cada minuto completado exitosamente');
  //   } catch (error) {
  //     this.logger.error('Error al ejecutar reporte cada minuto:', error);
  //   }
  // }
}
