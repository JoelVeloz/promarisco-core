export const geofenceEventGroupResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Entrada' },
      count: { type: 'number', example: 5 },
    },
  },
};



