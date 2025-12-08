export enum ReportType {
  PISCINAS = '4',
  CAMARONERAS = '13',
  HIELERAS = '10',
  PROHIBICIONES = '3',
}

export const REPORT_LABELS: Record<ReportType, { id: string; name: string }> = {
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
  [ReportType.PROHIBICIONES]: {
    id: '3',
    name: 'PROHIBICIONES',
  },
};

