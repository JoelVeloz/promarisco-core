export const zoneTimeResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      unit: { type: 'string', example: 'PM020' },
      zone: { type: 'string', example: 'PROMARISCO-DURAN' },
      startTime: {
        type: 'string',
        nullable: true,
        example: '2025-12-02T08:15:07.000Z',
        description: 'Fecha y hora de entrada a la zona (ISO UTC). Null si falta el evento de entrada.',
      },
      endTime: {
        type: 'string',
        nullable: true,
        example: '2025-12-02T09:30:15.000Z',
        description: 'Fecha y hora de salida de la zona (ISO UTC). Null si falta el evento de salida.',
      },
      startTimeReadable: {
        type: 'string',
        nullable: true,
        example: '02/12/2025, 08:15:07 AM',
        description: 'Fecha y hora de entrada en formato legible con AM/PM. Null si falta el evento de entrada.',
      },
      endTimeReadable: {
        type: 'string',
        nullable: true,
        example: '02/12/2025, 09:30:15 AM',
        description: 'Fecha y hora de salida en formato legible con AM/PM. Null si falta el evento de salida.',
      },
      durationMinutes: {
        type: 'number',
        nullable: true,
        example: 75,
        description: 'Duración en minutos entre startTime y endTime. Null si alguna de las fechas es null.',
      },
    },
    required: ['unit', 'zone'],
  },
  example: [
    {
      unit: 'PM020',
      zone: 'PROMARISCO-DURAN',
      startTime: '2025-12-02T08:15:07.000Z',
      endTime: '2025-12-02T09:30:15.000Z',
      startTimeReadable: '02/12/2025, 08:15:07 AM',
      endTimeReadable: '02/12/2025, 09:30:15 AM',
      durationMinutes: 75.25,
    },
    {
      unit: 'PM021',
      zone: 'PROMARISCO-GUAYAQUIL',
      startTime: '2025-12-02T10:00:00.000Z',
      endTime: null,
      startTimeReadable: '02/12/2025, 10:00:00 AM',
      endTimeReadable: null,
      durationMinutes: null,
    },
    {
      unit: 'PM022',
      zone: 'PROMARISCO-DURAN',
      startTime: null,
      endTime: '2025-12-02T11:00:00.000Z',
      startTimeReadable: null,
      endTimeReadable: '02/12/2025, 11:00:00 AM',
      durationMinutes: null,
    },
  ],
};

