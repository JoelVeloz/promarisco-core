import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InputJsonValue, JsonValue } from '@prisma/client/runtime/library';
import { REPORT_LABELS, ReportType } from './enums/report-type.enum';
import { WialonDataPoint, WialonReportData, WialonReportRow } from './types/wailon-report.types';
import { aplicarResultadoReporte, consultarEstadoReporte, ejecutarReporte, guardarFilasReporte, limpiarResultadoReporte, obtenerFilasReporte, obtenerSesion } from './utils/reports.util';

import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { ExecuteReportDto } from './dto/execute-report.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { config } from '../config';
import { join } from 'path';
import { writeFile } from 'fs/promises';

@Injectable()
export class WailonService implements OnModuleInit {
  private readonly logger = new Logger(WailonService.name);

  // Valores hardcoded del reporte
  private readonly REPORT_RESOURCE_ID = 600254226;
  private readonly REPORT_TEMPLATE_ID = 16;
  private readonly REPORT_OBJECT_ID = 600254226;

  //
  private readonly UNIT_INFO = 1;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Se ejecuta al inicializar el módulo
   * Procesa los reportes inmediatamente al iniciar la aplicación
   */
  async onModuleInit() {
    this.logger.log('Inicializando módulo Wailon - procesando reportes iniciales...');
    const meses = 2;
    const minutos = meses * 30 * 24 * 60;
    const delayMinutes = 20 * 60 * 1000;

    this.procesarReportesWailon(minutos, delayMinutes);
  }

  /**
   * Cron job que se ejecuta cada 5 segundos para procesar reportes de Wialon
   */
  // @Cron('*/60 * * * * *')
  async procesarReportesWailon(minutes: number, delayMinutes: number) {
    this.logger.verbose('Ejecutando cron job de reportes Wailon (cada 5 segundos)');

    const fechaDesde = DateTime.now().minus({ minutes: minutes }).toISO() as string;
    const fechaHasta = DateTime.now().toISO() as string;

    // Ejecutar secuencialmente para todos los tipos de reporte
    const tiposReporte = Object.values(ReportType);

    for (const tipoReporte of tiposReporte) {
      try {
        this.logger.log(`Iniciando procesamiento para tipo de reporte: ${tipoReporte}`);
        await this.ejecutarReporteCompleto({ fechaDesde, fechaHasta, tipoReporte });
        await new Promise((resolve) => setTimeout(resolve, delayMinutes));
      } catch (error) {
        this.logger.error(`Error al procesar reporte ${tipoReporte}:`, error);
      }
    }
    this.logger.log('✓ Proceso completo para todos los tipos de reporte finalizado');
  }

  /**
   * Guarda los reportes en la base de datos, evitando duplicados y actualizando t2 si cambia
   */
  private async guardarEnBase(reportRows: WialonReportData, tipoReporte: ReportType): Promise<void> {
    // Extraer solo los elementos del array "r" de cada reporte
    const reportRowsToSave: WialonReportRow[] = [];
    for (const reportItem of reportRows) {
      if (reportItem.r && Array.isArray(reportItem.r)) {
        reportRowsToSave.push(...reportItem.r);
      }
    }

    // Función helper para generar clave única: t1, uid, c[2] (nombre de zona)
    // Nota: c[2] del elemento de r es equivalente a c[0] del objeto principal
    const generateUniqueKey = (row: WialonReportRow): string => {
      const zonaName = typeof row.c[2] === 'string' ? row.c[2] : '';
      return `${row.t1}_${row.uid}_${zonaName}`;
    };

    // Verificar duplicados y actualizar t2 si es necesario
    const reportName = 'REPORTES-ALCONSA';

    // Obtener todos los registros existentes con el mismo nombre (incluyendo ID para actualizar)
    const existingReports = await this.prisma.wailonReport.findMany({
      where: { name: reportName },
      select: { id: true, data: true },
    });

    // Crear un Map con las claves únicas y los registros existentes (para poder actualizar)
    const existingReportsMap = new Map<string, { id: string; data: WialonReportRow }>();
    for (const report of existingReports) {
      if (report.data && typeof report.data === 'object' && !Array.isArray(report.data)) {
        const data = report.data as unknown as WialonReportRow;
        if (data.t1 !== undefined && data.uid !== undefined && data.c && Array.isArray(data.c)) {
          const key = generateUniqueKey(data);
          existingReportsMap.set(key, { id: report.id, data });
        }
      }
    }

    // Separar en nuevos registros y registros que necesitan actualización
    const newReportRows: WialonReportRow[] = [];
    const rowsToUpdate: Array<{ id: string; row: WialonReportRow }> = [];

    for (const row of reportRowsToSave) {
      const key = generateUniqueKey(row);
      const existing = existingReportsMap.get(key);

      if (existing) {
        // Si existe, verificar si t2 cambió
        if (existing.data.t2 !== row.t2) {
          rowsToUpdate.push({ id: existing.id, row });
        }
      } else {
        // Si no existe, agregar a nuevos
        newReportRows.push(row);
      }
    }

    // Insertar nuevos registros
    if (newReportRows.length > 0) {
      await this.prisma.wailonReport.createMany({
        data: newReportRows.map((row) => ({
          name: reportName,
          transformed: {
            group: REPORT_LABELS[tipoReporte].name,
            unit: row.c[1],
            zone: row.c[2],
            entryTime: DateTime.fromSeconds((row.c[3] as any).v).toISO() as string,
            exitTime: DateTime.fromSeconds((row.c[4] as any).v).toISO() as string,
          } as InputJsonValue,
          data: row as unknown as JsonValue,
        })),
      });
      this.logger.log(`✓ Insertados ${newReportRows.length} nuevos registros`);
    }

    // Actualizar registros existentes si t2 cambió
    if (rowsToUpdate.length > 0) {
      for (const { id, row } of rowsToUpdate) {
        await this.prisma.wailonReport.update({
          where: { id },
          data: {
            transformed: {
              group: REPORT_LABELS[tipoReporte].name,
              unit: row.c[1],
              zone: row.c[2],
              entryTime: DateTime.fromSeconds((row.c[3] as any).v).toISO() as string,
              exitTime: DateTime.fromSeconds((row.c[4] as any).v).toISO() as string,
            } as InputJsonValue,
            data: row as unknown as JsonValue,
          },
        });
      }
      this.logger.log(`✓ Actualizados ${rowsToUpdate.length} registros existentes (t2 modificado)`);
    }

    const totalProcessed = reportRowsToSave.length;
    const skipped = totalProcessed - newReportRows.length - rowsToUpdate.length;
    if (skipped > 0) {
      this.logger.log(`✓ ${skipped} registros sin cambios (duplicados omitidos)`);
    }
  }

  /**
   * Guarda el reporte en un archivo JSON considerando el tipo de reporte
   */
  private async guardarJsonReporte(reportRows: WialonReportData, tipoReporte: ReportType): Promise<void> {
    try {
      const reportLabel = REPORT_LABELS[tipoReporte];
      const fileName = `report-rows-${reportLabel.name.toLowerCase()}.json`;
      const filePath = join(process.cwd(), fileName);

      // Agregar el tipo de reporte a cada item para referencia
      const reportDataWithType = reportRows.map((item) => ({
        ...item,
        tipoReporte,
        tipoReporteName: reportLabel.name,
      }));

      await writeFile(filePath, JSON.stringify(reportDataWithType, null, 2), 'utf-8');
      this.logger.log(`✓ JSON guardado: ${fileName} (${reportDataWithType.length} items)`);
    } catch (error) {
      this.logger.error(`Error al guardar JSON para tipo de reporte ${tipoReporte}:`, error);
      // No lanzar el error para que el proceso continúe
    }
  }

  /**
   * Ejecuta un reporte completo en Wialon
   */
  async ejecutarReporteCompleto(params: ExecuteReportDto): Promise<WialonReportData> {
    const fechaDesde = DateTime.fromISO(params.fechaDesde, { zone: 'utc' });
    const fechaHasta = DateTime.fromISO(params.fechaHasta, { zone: 'utc' });
    const fechaFrom = fechaDesde.toUnixInteger();
    const fechaTo = fechaHasta.toUnixInteger();

    this.logger.verbose(`Ejecutando reporte tipo 
        ${REPORT_LABELS[params.tipoReporte].name} - 
        ${params.tipoReporte} desde ${fechaDesde.setZone('America/Guayaquil').toISO()} hasta 
        ${fechaHasta.setZone('America/Guayaquil').toISO()}`);

    // Paso 1: Obtener o regenerar sesión
    const eid = await obtenerSesion(config.WAILON_TOKEN);

    // Paso 2: Ejecutar el reporte
    await ejecutarReporte({
      eid,
      reportResourceId: this.REPORT_RESOURCE_ID,
      reportTemplateId: this.REPORT_TEMPLATE_ID,
      reportObjectId: this.REPORT_OBJECT_ID,
      reportObjectSecId: params.tipoReporte,
      fechaFrom,
      fechaTo,
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
      unitInfo: this.UNIT_INFO,
    });

    // Paso 6: Limpiar resultado del reporte antes de guardar
    await limpiarResultadoReporte({ eid });

    // Paso 7: Guardar en base de datos
    await this.guardarEnBase(reportRows, params.tipoReporte);

    // Paso 8: Guardar JSON considerando el tipo de reporte
    await this.guardarJsonReporte(reportRows, params.tipoReporte);

    this.logger.log('✓ Proceso de reporte completado exitosamente');

    return reportRows;
  }
}
