export const zoneTimeResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      unit: { type: 'string', example: 'PM001' },
      zone: { type: 'string', example: 'INGRESO-POR-MUELLE-PROMARISCO' },
      group: { type: 'string', nullable: true, example: 'CAMARONERAS' },
      entryTime: {
        type: 'string',
        nullable: true,
        example: '2025-12-02T12:16:09.000Z',
        description: 'Fecha y hora de entrada a la zona (ISO UTC). Null si falta el evento de entrada.',
      },
      exitTime: {
        type: 'string',
        nullable: true,
        example: '2025-12-02T12:22:09.000Z',
        description: 'Fecha y hora de salida de la zona (ISO UTC). Null si falta el evento de salida.',
      },
    },
    required: ['unit', 'zone'],
  },
  example: [
    {
      unit: 'PM001',
      zone: 'INGRESO-POR-MUELLE-PROMARISCO',
      group: 'CAMARONERAS',
      entryTime: '2025-12-02T12:16:09.000Z',
      exitTime: '2025-12-02T12:22:09.000Z',
    },
    {
      unit: 'PM002',
      zone: 'PROMARISCO-DURAN',
      group: 'HIELERAS',
      entryTime: '2025-12-02T10:00:00.000Z',
      exitTime: null,
    },
  ],
};
