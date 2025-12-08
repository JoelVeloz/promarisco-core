import { Module } from '@nestjs/common';
import { WailonController } from './wailon.controller';
import { WailonService } from './wailon.service';

@Module({
  controllers: [WailonController],
  providers: [WailonService],
  exports: [WailonService],
})
export class WailonModule {}
