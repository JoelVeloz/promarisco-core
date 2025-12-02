import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GeofenceEventGroup {
  name: string;
  count: number;
}

@Injectable()
export class GeofenceEventsService {
  constructor(private prisma: PrismaService) {}

  async groupByName(): Promise<GeofenceEventGroup[]> {
    // Usar agregación de MongoDB directamente en la base de datos
    // Esto es mucho más eficiente que traer todos los registros y agruparlos en memoria
    const result = await this.prisma.geofenceEvent.aggregateRaw({
      pipeline: [
        {
          $group: {
            _id: '$name',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            name: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ],
    });

    // aggregateRaw devuelve un tipo genérico, necesitamos hacer un cast
    return result as unknown as GeofenceEventGroup[];
  }
}
