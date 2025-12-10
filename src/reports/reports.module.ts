import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300000, // Tiempo de vida del caché en milisegundos (5 minutos)
      max: 100, // Número máximo de items en caché
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
