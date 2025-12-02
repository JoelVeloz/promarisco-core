export const geofenceEventResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '692ee693539d08244212069d' },
      name: { type: 'string', example: 'ENTRADA_GEOCERCA' },
      payload: { type: 'object' },
      transformed: {
        type: 'object',
        properties: {
          UNIT: { type: 'string', example: 'PM020' },
          ZONE: { type: 'string', example: 'PROMARISCO-DURAN' },
          POS_TIME: { type: 'string', example: '02.12.2025 08:15:07' },
          POS_TIME_UTC: { type: 'string', example: '2025-12-02T08:15:07.000Z' },
          SPEED: { type: 'string', example: '4 km/h' },
          LOCATION: { type: 'string', example: 'Vía Durán - Vírgen De Fátima' },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
};

