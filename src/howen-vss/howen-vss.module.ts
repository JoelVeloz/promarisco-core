import { HowenVssApiService } from './howen-vss-api.service';
import { HowenVssAuthService } from './howen-vss-auth.service';
import { HowenVssService } from './howen-vss.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [HowenVssApiService, HowenVssAuthService, HowenVssService],
  exports: [HowenVssApiService, HowenVssAuthService, HowenVssService],
})
export class HowenVssModule {}
