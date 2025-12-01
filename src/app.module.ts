import { AlertsModule } from './alerts/alerts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
