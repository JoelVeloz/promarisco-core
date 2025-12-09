import { ApplyReportResult, WialonReportData } from '../types/wailon-report.types';
import { readFile, writeFile } from 'fs/promises';

import { DateTime } from 'luxon';
import { fetchWailon } from './fetch-wailon.util';

const SESSION_FILE = 'session.json';
const SESSION_TIMEOUT_MINUTES = 5;
const host = 'hst-api.wialon.eu';

// Función helper para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Obtiene o regenera la sesión (eid) verificando si han pasado 5 minutos o más
 */
export async function obtenerSesion(token: string): Promise<string> {
  let eid = '';
  let needsLogin = false;

  // Intentar leer el eid guardado y verificar la fecha
  try {
    const sessionData = await readFile(SESSION_FILE, 'utf-8');
    const session = JSON.parse(sessionData) as { eid?: string; fecha?: string };

    if (session.eid) {
      eid = session.eid;
      console.log('Session ID encontrado:', eid);

      // Verificar si existe la fecha y si han pasado 5 minutos o más
      if (session.fecha) {
        const fechaGuardada = DateTime.fromISO(session.fecha);
        const fechaActual = DateTime.now();
        const diferenciaMinutos = fechaActual.diff(fechaGuardada, 'minutes').minutes;

        if (diferenciaMinutos >= SESSION_TIMEOUT_MINUTES) {
          console.log(`Han pasado ${diferenciaMinutos.toFixed(2)} minutos desde la última sesión. Regenerando token...`);
          needsLogin = true;
        } else {
          console.log(`Sesión válida. Han pasado ${diferenciaMinutos.toFixed(2)} minutos desde la última sesión.`);
        }
      } else {
        // Si no hay fecha, regenerar el token
        console.log('No se encontró fecha en la sesión. Regenerando token...');
        needsLogin = true;
      }
    } else {
      console.log('No se encontró eid en la sesión. Haciendo login...');
      needsLogin = true;
    }
  } catch (error) {
    console.log('No se encontró sesión guardada, haciendo login...');
    needsLogin = true;
  }

  // Si no hay eid o han pasado 5 minutos o más, hacer login
  if (!eid || needsLogin) {
    console.log('Haciendo login con token...');
    const result = (await fetchWailon('token/login', { token }, '', host)) as { eid?: string };
    console.log('✓ Login exitoso');
    eid = result.eid as string;
    console.log('Session ID (eid):', eid);

    // Guardar el eid y la fecha actual en session.json
    const fechaActual = DateTime.now().toISO();
    await writeFile(SESSION_FILE, JSON.stringify({ eid, fecha: fechaActual }, null, 2), 'utf-8');
    console.log('Session ID y fecha guardados en', SESSION_FILE);

    // Guardar también el resultado completo del login
    await writeFile('login-result.json', JSON.stringify(result, null, 2), 'utf-8');
  }

  return eid;
}

/**
 * Ejecuta un reporte en Wialon
 */
export async function ejecutarReporte(params: {
  eid: string;
  reportResourceId: number;
  reportTemplateId: number;
  reportObjectId: number;
  reportObjectSecId: string;
  fechaFrom: number;
  fechaTo: number;
}): Promise<Record<string, unknown>> {
  console.log('Paso 1: Ejecutando reporte...');
  const execReportParams = {
    reportResourceId: params.reportResourceId,
    reportTemplateId: params.reportTemplateId,
    reportTemplate: null,
    reportObjectId: params.reportObjectId,
    reportObjectSecId: params.reportObjectSecId,
    interval: { flags: 16777216, from: params.fechaFrom, to: params.fechaTo },
    remoteExec: 1,
  };
  const execReportResult = (await fetchWailon('report/exec_report', execReportParams, params.eid, host)) as Record<string, unknown>;
  console.log('Reporte ejecutado:', execReportResult);
  console.log('✓ Reporte iniciado correctamente');
  return execReportResult;
}

/**
 * Consulta el estado del reporte hasta que termine
 */
export async function consultarEstadoReporte(params: { eid: string; maxAttempts?: number; pollInterval?: number }): Promise<void> {
  const { eid, maxAttempts = 120, pollInterval = 500 } = params;
  console.log('Paso 2: Consultando estado del reporte...');
  let reportStatus = '1';
  let attempts = 0;

  while (reportStatus !== '4' && attempts < maxAttempts) {
    attempts++;
    const statusResult = await fetchWailon('report/get_report_status', {}, eid, host);
    const statusObj = statusResult as { status?: string | number };
    reportStatus = String(statusObj.status || statusResult);

    if (reportStatus === '4') {
      console.log(`✓ Reporte finalizado (intento ${attempts})`);
      break;
    }

    if (reportStatus === '5') {
      throw new Error('El reporte terminó con error');
    }

    // Solo mostrar estado cada 5 intentos para reducir logs
    if (attempts % 5 === 0 || attempts === 1) {
      const statusMessages: Record<string, string> = {
        '1': 'Procesando',
        '2': 'Recolectando información',
        '3': 'Armando tablas',
      };
      console.log(`⏳ ${statusMessages[reportStatus] || `Estado ${reportStatus}`}... (intento ${attempts})`);
    }

    await sleep(pollInterval);
  }

  if (reportStatus !== '4') {
    throw new Error('El reporte no terminó de procesarse en el tiempo esperado');
  }
}

/**
 * Aplica el resultado del reporte
 */
export async function aplicarResultadoReporte(params: { eid: string }): Promise<ApplyReportResult> {
  console.log('Paso 3: Aplicando resultado del reporte...');
  const applyReportResult = (await fetchWailon('report/apply_report_result', {}, params.eid, host)) as ApplyReportResult;
  console.log('Resultado aplicado:', applyReportResult);
  console.log('✓ Resultado aplicado correctamente');
  return applyReportResult;
}

/**
 * Obtiene las filas del reporte usando select_result_rows
 */
export async function obtenerFilasReporte(params: { eid: string; tableIndex?: number; from?: number; to?: number; level?: number; unitInfo?: number }): Promise<WialonReportData> {
  const { eid, tableIndex = 0, from = 0, to = 9, level = 0, unitInfo = 1 } = params;
  console.log('Paso 4: Obteniendo filas del reporte...');
  const selectRowsParams = {
    tableIndex,
    config: {
      type: 'range',
      data: {
        from,
        to,
        level,
        unitInfo,
      },
    },
  };
  const reportRows = (await fetchWailon('report/select_result_rows', selectRowsParams, eid, host)) as unknown;
  // console.log('Filas del reporte obtenidas:', reportRows);
  // La API de Wialon retorna un array directamente
  return (Array.isArray(reportRows) ? reportRows : []) as WialonReportData;
}

/**
 * Guarda las filas del reporte en un archivo JSON
 */
export async function guardarFilasReporte(reportRows: WialonReportData, outputFile: string = 'report-result.json'): Promise<void> {
  await writeFile(outputFile, JSON.stringify(reportRows, null, 2), 'utf-8');
  console.log(`Resultado guardado en ${outputFile}`);
}

/**
 * Limpia el resultado del reporte antes de guardar
 */
export async function limpiarResultadoReporte(params: { eid: string }): Promise<void> {
  console.log('Limpiando resultado del reporte...');
  await fetchWailon('report/cleanup_result', {}, params.eid, host);
  console.log('✓ Resultado del reporte limpiado correctamente');
}

/**
 * Exporta el reporte completo (opcional)
 */
export async function exportarReporte(params: { eid: string; type?: string; outputFile?: string }): Promise<Record<string, unknown>> {
  const { eid, type = 'xls', outputFile = 'export-result.json' } = params;
  console.log('Paso 5 (Opcional): Exportando reporte...');
  const exportParams = { type };
  const exportResult = (await fetchWailon('report/export_result', exportParams, eid, host)) as Record<string, unknown>;
  console.log('Reporte exportado:', exportResult);
  await writeFile(outputFile, JSON.stringify(exportResult, null, 2), 'utf-8');
  console.log(`✓ URL de exportación guardada en ${outputFile}`);
  return exportResult;
}

/**
 * Ejecuta una llamada batch a la API de Wialon
 */
export async function ejecutarBatch(params: { eid: string; params: Array<{ svc: string; params: Record<string, unknown> }>; flags?: number }): Promise<unknown[]> {
  const batchParams = {
    params: params.params,
    flags: params.flags ?? 0,
  };

  const result = await fetchWailon('core/batch', batchParams, params.eid, host);

  // La respuesta de batch es un array de respuestas
  // El servicio core/batch siempre retorna un array
  if (Array.isArray(result)) {
    return result;
  }
  // Si por alguna razón no es un array, retornar el resultado como único elemento
  return [result];
}
