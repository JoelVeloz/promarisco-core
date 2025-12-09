/**
 * Tipos para la estructura de datos de reportes de Wialon
 * Basado en la estructura retornada por obtenerFilasReporte
 */

/**
 * Punto de datos GPS dentro del array `c` o `r`
 */
export interface WialonDataPoint {
  /** Fecha/hora formateada (DD.MM.YYYY HH:mm:ss) */
  t: string;
  /** Timestamp Unix */
  v: number;
  /** Longitud (coordenada GPS) */
  x: number;
  /** Latitud (coordenada GPS) */
  y: number;
  /** Unit ID (ID de la unidad/vehículo) */
  u: number;
}

/**
 * Elemento del array `c` que puede ser un string (nombre de zona) o un objeto de datos
 */
export type WialonCItem = string | WialonDataPoint | '';

/**
 * Elemento del array `r` (sub-reporte detallado por unidad)
 */
export interface WialonReportRow {
  /** Índice del reporte */
  n: number;
  /** Índice inicial */
  i1: number;
  /** Índice final */
  i2: number;
  /** Timestamp Unix de inicio */
  t1: number;
  /** Timestamp Unix de fin */
  t2: number;
  /** Duración */
  d: number;
  /** Unit ID */
  uid: number;
  /** Marca */
  mrk: number;
  /** Array de datos que contiene:
   * - [0]: Nombre de la unidad (string, ej: "PM001", "PM002")
   * - [1]: Nombre de la zona (string, ej: "ISLA-QUIÑONEZ", "Out of geofences")
   * - [2]: "-----" o WialonDataPoint (punto de entrada)
   * - [3]: "-----" o WialonDataPoint (punto de salida)
   * - [4]: Duración formateada (string, ej: "0:00:00", "0:22:56")
   */
  c: Array<string | WialonDataPoint>;
}

/**
 * Item principal del reporte de Wialon
 */
export interface WialonReportItem {
  /** Índice del reporte */
  n: number;
  /** Índice inicial */
  i1: number;
  /** Índice final */
  i2: number;
  /** Timestamp Unix de inicio del período */
  t1: number;
  /** Timestamp Unix de fin del período */
  t2: number;
  /** Duración */
  d: number;
  /** Unit ID (0 si es un resumen) */
  uid: number;
  /** Marca */
  mrk: number;
  /** Array de datos del reporte que contiene:
   * - [0]: Nombre de la unidad (string, ej: "PM001", "PM002")
   * - [1]: String vacío ("")
   * - [2]: "-----" o WialonDataPoint (punto de entrada)
   * - [3]: "-----" o WialonDataPoint (punto de salida)
   * - [4]: Duración formateada (string, ej: "0:00:00", "0:22:56")
   */
  c: WialonCItem[];
  /** Array opcional de sub-reportes detallados por unidad */
  r?: WialonReportRow[];
  /** Tipo de reporte (agregado al guardar en el JSON para filtrado) */
  tipoReporte?: string;
}

/**
 * Tipo para el array completo de reportes retornado por Wialon
 */
export type WialonReportData = WialonReportItem[];

/**
 * Resultado del reporte aplicado
 */
export interface ReportResult {
  /** Número de mensajes renderizados */
  msgsRendered: number;
  /** Estadísticas del reporte */
  stats: unknown[];
  /** Tablas del reporte */
  tables: TableResult[];
  /** Adjuntos del reporte */
  attachments: unknown[];
}

export interface TableResult {
  /** Nombre de la tabla */
  name: string;
  /** Número de filas */
  rows: number;
}
/**
 * Capa del reporte
 */
export interface ReportLayer {
  /** Nombre de la capa */
  name: string;
  /** Límites de la capa [minX, minY, maxX, maxY] */
  bounds: [number, number, number, number];
}

/**
 * Resultado de aplicar el reporte (retornado por aplicarResultadoReporte)
 */
export interface ApplyReportResult {
  /** Resultado del reporte */
  reportResult: ReportResult;
  /** Capa del reporte */
  reportLayer: ReportLayer;
  /** Número de capas */
  layerCount: number;
}
