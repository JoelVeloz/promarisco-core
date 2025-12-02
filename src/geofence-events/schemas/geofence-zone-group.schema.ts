export const geofenceZoneGroupResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      zone: { type: 'string', example: 'PROMARISCO-DURAN' },
      count: { type: 'number', example: 15 },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'ENTRADA_GEOCERCA' },
            count: { type: 'number', example: 10 },
          },
        },
        example: [
          { name: 'ENTRADA_GEOCERCA', count: 10 },
          { name: 'SALIDA_GEOCERCA', count: 5 },
        ],
      },
    },
  },
};

