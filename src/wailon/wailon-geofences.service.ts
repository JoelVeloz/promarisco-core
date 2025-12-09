import { Injectable, Logger } from '@nestjs/common';
import { REPORT_LABELS, ReportType } from './enums/report-type.enum';
import { aplicarResultadoReporte, consultarEstadoReporte, ejecutarReporte, limpiarResultadoReporte, obtenerFilasReporte, obtenerSesion } from './utils/reports.util';
import { mkdir, writeFile } from 'fs/promises';

import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { WialonReportData } from './types/wailon-report.types';
import { config } from '../config';
import { join } from 'path';

@Injectable()
export class WailonGeofencesService {
  private readonly logger = new Logger(WailonGeofencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ejecuta reportes de geocercas para todos los zonegroups con un rango de tiempo de 1 semana
   * Se ejecuta una vez por cada zonegroup
   */
  async ejecutarReportesDeGeocercasPorZonegroup(): Promise<void> {
    this.logger.log('Iniciando ejecución de reportes de geocercas para todos los zonegroups (última semana)...');

    // Obtener o regenerar sesión una sola vez
    const eid = await obtenerSesion(config.WAILON_TOKEN);

    // Calcular fechas: última semana
    const fechaHasta = DateTime.now();
    const fechaDesde = fechaHasta.minus({ weeks: 2 });
    const fechaFrom = fechaDesde.toUnixInteger();
    const fechaTo = fechaHasta.toUnixInteger();

    this.logger.verbose(`Rango de fechas: desde ${fechaDesde.setZone('America/Guayaquil').toISO()} hasta ${fechaHasta.setZone('America/Guayaquil').toISO()}`);

    // Obtener todos los tipos de reporte (zonegroups)
    const tiposReporte = Object.values(ReportType);

    // Iterar sobre cada zonegroup y ejecutar el reporte
    for (const zonegroup of tiposReporte) {
      try {
        this.logger.log(`Ejecutando reporte de geocercas para zonegroup: ${zonegroup}`);

        await this.ejecutarReporteDeGeocercas({ eid, fechaFrom, fechaTo, zonegroup });

        this.logger.verbose(`✓ Reporte completado para zonegroup: ${zonegroup}`);
      } catch (error) {
        this.logger.error(`Error al ejecutar reporte para zonegroup ${zonegroup}:`, error);
        // Continuar con el siguiente zonegroup aunque haya un error
      }
    }

    this.logger.log('✓ Proceso de reportes de geocercas por zonegroup completado');
  }

  /**
   * Ejecuta un reporte de geocercas específico con un zonegroup
   */
  async ejecutarReporteDeGeocercas(params: { eid: string; fechaFrom: number; fechaTo: number; zonegroup: ReportType }): Promise<WialonReportData> {
    const { eid, fechaFrom, fechaTo, zonegroup } = params;

    this.logger.verbose(`Ejecutando reporte de geocercas con zonegroup: ${zonegroup}`);

    // Parámetros de reporte basados en la configuración proporcionada
    const REPORT_RESOURCE_ID = 600254226;
    const REPORT_TEMPLATE_ID = 16;
    const REPORT_OBJECT_ID = 600254226;
    const REPORT_OBJECT_SEC_ID = '13';

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
      this.logger.warn(`No se encontraron tablas en el reporte para zonegroup: ${zonegroup}`);
      return [];
    }

    // Paso 5: Obtener filas del reporte
    console.log(applyReportResult?.reportResult?.tables);
    const rowsCount = applyReportResult?.reportResult?.tables?.[0]?.rows;

    const reportRows = await obtenerFilasReporte({
      eid,
      tableIndex: 0,
      from: 0,
      to: rowsCount - 1,
      level: 1,
      unitInfo: 1,
    });

    console.log(reportRows);
    // Agregar el zonegroup a cada fila del reporte
    const reportRowsWithZonegroup = reportRows.map(item => ({
      ...item,
      zonegroup,
    }));

    // Paso 6: Limpiar resultado del reporte antes de guardar
    await limpiarResultadoReporte({ eid });
    await limpiarResultadoReporte({ eid });
    await limpiarResultadoReporte({ eid });

    // Paso 7: Guardar JSON en carpeta geocercas/ZONE_GROUP
    await this.guardarJsonGeocercas(reportRowsWithZonegroup, zonegroup);

    this.logger.verbose(`✓ Reporte de geocercas completado para zonegroup: ${zonegroup}`);

    return reportRowsWithZonegroup;
  }

  /**
   * Guarda el reporte de geocercas en un archivo JSON en la carpeta geocercas/ZONE_GROUP
   */
  private async guardarJsonGeocercas(reportRows: WialonReportData, zonegroup: ReportType): Promise<void> {
    try {
      const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
      const zonegroupName = REPORT_LABELS[zonegroup]?.name || zonegroup;
      const fileName = `report-rows-${timestamp}.json`;

      // Crear carpeta geocercas/ZONE_GROUP si no existe
      const geocercasDir = join(process.cwd(), 'data', 'geocercas', zonegroupName);
      await mkdir(geocercasDir, { recursive: true });

      const filePath = join(geocercasDir, fileName);

      await writeFile(filePath, JSON.stringify(reportRows, null, 2), 'utf-8');
      this.logger.log(`✓ JSON guardado: ${filePath} (${reportRows.length} items)`);
    } catch (error) {
      this.logger.error(`Error al guardar JSON de geocercas:`, error);
      throw error;
    }
  }
}
