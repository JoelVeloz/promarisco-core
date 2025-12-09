import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

interface GetAllFilters {
  unit?: string;
  startTime?: string;
  endTime?: string;
  zone?: string;
  group?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getAll(filters?: GetAllFilters): Promise<any[]> {
    const matchConditions: any = {
      ...(filters?.unit && { unit: filters.unit }),
      ...(filters?.zone && { zone: filters.zone }),
      ...(filters?.group && { group: filters.group }),
      ...((filters?.startTime || filters?.endTime) && {
        entryTime: {
          ...(filters.startTime && { $gte: new Date(filters.startTime) }),
          ...(filters.endTime && { $lte: new Date(filters.endTime) }),
        },
      }),
    };

    const pipeline: any[] = [
      ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),

      // Ordenar
      { $sort: { entryTime: -1 } },
    ];
    const docs = (await this.prisma.$runCommandRaw({
      aggregate: 'report_zones',
      pipeline,
      cursor: { batchSize: 20000 },
    })) as any;

    const result = docs.cursor?.firstBatch || [];

    return result.map((d: any) => ({
      unit: d.unit,
      zone: d.zone,
      group: d.group,
      entryTime: d.entryTime?.$date,
      exitTime: d.exitTime?.$date,
      distance: d.distance,
      fuel: d.fuel,
      fuelConsumption: d.fuelConsumption,
    }));
  }
}
