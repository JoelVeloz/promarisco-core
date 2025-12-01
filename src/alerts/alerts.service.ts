import { Alert } from '@prisma/client';
import { FindAllAlertsDto } from './dto/find-all-alerts.dto';
import { Injectable } from '@nestjs/common';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllAlertsDto): Promise<PaginationResult<Alert>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.alert.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<Alert | null> {
    return this.prisma.alert.findUnique({
      where: { id },
    });
  }
}
