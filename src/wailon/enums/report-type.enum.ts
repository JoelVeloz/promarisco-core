export enum ReportType {
  PROHIBICIONES = '3',
  PISCINAS = '16',
  CAMARONERAS = '13',
  HIELERAS = '10',
}

export const REPORT_LABELS: Record<ReportType, { id: string; name: string }> = {
  [ReportType.PROHIBICIONES]: {
    id: '3',
    name: 'PROHIBICIONES',
  },
  [ReportType.PISCINAS]: {
    id: '4',
    name: 'PISCINAS',
  },
  [ReportType.CAMARONERAS]: {
    id: '13',
    name: 'CAMARONERAS',
  },
  [ReportType.HIELERAS]: {
    id: '10',
    name: 'HIELERAS',
  },
};
