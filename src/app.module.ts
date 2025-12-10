import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GeofencesModule } from './geofences/geofences.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { WailonModule } from './wailon/wailon.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), ReportsModule, AuthModule, WailonModule, UsersModule, GeofencesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
