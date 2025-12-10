import * as fs from 'fs';

import { Injectable, Logger } from '@nestjs/common';
import { WialonReportData, WialonReportItem, WialonReportRow } from './types/wailon-report.types';
import { aplicarResultadoReporte, consultarEstadoReporte, ejecutarReporte, guardarJsonReporte, limpiarResultadoReporte, obtenerFilasReporte, obtenerSesion } from './utils/reports.util';

import { DateTime } from 'luxon';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { config } from '../config';
import { obtenerZonaPorGeocerca } from 'src/wailon/utils/geocercas';

@Injectable()
export class WailonReportsService {
  private readonly logger = new Logger(WailonReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ejecuta un reporte completo en Wialon
   */
  async ejecutarReporteDeUnidades(params: { fechaDesde: string; fechaHasta: string }): Promise<WialonReportData> {
    const fechaDesde = DateTime.fromISO(params.fechaDesde, { zone: 'utc' });
    const fechaHasta = DateTime.fromISO(params.fechaHasta, { zone: 'utc' });
    const fechaFrom = fechaDesde.toUnixInteger();
    const fechaTo = fechaHasta.toUnixInteger();

    this.logger.verbose(`Ejecutando reporte desde ${fechaDesde.setZone('America/Guayaquil').toISO()} hasta ${fechaHasta.setZone('America/Guayaquil').toISO()}`);

    // Paso 1: Obtener o regenerar sesión
    const eid = await obtenerSesion(config.WAILON_TOKEN);

    // Valores hardcoded del reporte
    const REPORT_RESOURCE_ID = 600254226;
    const REPORT_TEMPLATE_ID = 17;
    const REPORT_OBJECT_ID = 600489149;
    const REPORT_OBJECT_SEC_ID = '0'; // Valor por defecto

    // Paso 2: Ejecutar el reporte
    await ejecutarReporte({
      eid,
      reportResourceId: REPORT_RESOURCE_ID,
      reportTemplateId: REPORT_TEMPLATE_ID,
      reportObjectId: REPORT_OBJECT_ID,
      reportObjectSecId: REPORT_OBJECT_SEC_ID,
      fechaFrom,
      fechaTo,
      flags: 16777216,
    });

    // Paso 3: Consultar el estado del reporte hasta que termine
    const timeMax = 1 * 60 * 1000; // 1 minuto
    await consultarEstadoReporte({ eid, maxAttempts: Math.floor(timeMax / 500), pollInterval: 500 });
    // Paso 4: Aplicar el resultado del reporte
    const applyReportResult = await aplicarResultadoReporte({ eid });

    if (applyReportResult?.reportResult?.tables?.length <= 0) {
      this.logger.warn('No se encontraron tablas en el reporte');
      return [];
    }

    // Paso 5: Obtener filas del reporte
    const rowsCount = applyReportResult?.reportResult?.tables?.[0]?.rows;

    const reportRows = await obtenerFilasReporte({
      eid,
      tableIndex: 0,
      from: 0,
      to: rowsCount - 1,
      level: 1,
      unitInfo: 1,
    });

    // Paso 6: Limpiar resultado del reporte antes de guardar
    await limpiarResultadoReporte({ eid });
    await limpiarResultadoReporte({ eid });
    await limpiarResultadoReporte({ eid });

    // Paso 7: Guardar en base de datos
    await this.guardarReportesEnBaseDeDatos(reportRows);

    // Paso 8: Guardar JSON local
    await guardarJsonReporte(reportRows);

    this.logger.log('✓ Proceso de reporte completado exitosamente');

    return reportRows;
  }

  /**
   * Genera el objeto transformed a partir de un elemento r (WialonReportRow)
   */
  private generarTransformedFromRow(row: WialonReportRow): Prisma.InputJsonValue {
    return {
      group: '',
      // group: obtenerZonaPorGeocerca(row.c[1] as string),
      unit: row.c[0],
      zone: row.c[1],
      entryTime: (row.c[2] as any)?.v ? (DateTime.fromSeconds((row.c[2] as any).v).toISO() as string) : null,
      exitTime: (row.c[3] as any)?.v ? (DateTime.fromSeconds((row.c[3] as any).v).toISO() as string) : null,
    } as Prisma.InputJsonValue;
  }

  /**
   * Guarda reportes en la base de datos
   * Elimina todos los reportes existentes y crea nuevos desde cero
   */
  async guardarReportesEnBaseDeDatos(reportData: WialonReportData): Promise<void> {
    try {
      this.logger.log(`Procesando ${reportData.length} reportes para guardar en base de datos`);

      // Eliminar todos los reportes existentes
      await this.prisma.wailonReport.deleteMany({ where: { name: 'NUEVO INFORME' } });
      this.logger.verbose('Reportes existentes eliminados');

      // Preparar todos los reportes para crear
      const toCreate: any[] = [];

      // Iterar sobre cada reporte y cada elemento r dentro de cada reporte
      reportData.forEach(report => {
        if (!report.r || report.r.length === 0) return;

        report.r.forEach((r: WialonReportRow) => {
          // Generar transformed
          const transformed = this.generarTransformedFromRow(r);

          // El dato completo del elemento r se guarda en el campo data
          toCreate.push({
            name: 'NUEVO INFORME',
            data: r, // Guardar todo el elemento r como data
            transformed,
          });
        });
      });

      // Crear todos los reportes
      if (toCreate.length > 0) {
        await this.prisma.wailonReport.createMany({ data: toCreate });
        this.logger.verbose(`Creados ${toCreate.length} reportes`);
      }

      this.logger.log(`✓ Proceso de guardado en base de datos completado: ${reportData.length} reportes procesados`);
    } catch (error) {
      this.logger.error(`Error al guardar reportes en base de datos: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Guarda reportes desde un archivo JSON en la base de datos
   * Elimina todos los reportes existentes y crea nuevos desde cero
   */
  async guardarReportesDesdeArchivo(filePath: string): Promise<void> {
    try {
      // Leer el archivo JSON
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const reportData: WialonReportData = JSON.parse(fileContent);

      this.logger.log(`Procesando ${reportData.length} reportes desde ${filePath}`);

      await this.guardarReportesEnBaseDeDatos(reportData);
    } catch (error) {
      this.logger.error(`Error al guardar reportes desde archivo: ${error.message}`, error.stack);
      throw error;
    }
  }
}
