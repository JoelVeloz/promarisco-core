import { HowenVssApiService } from './howen-vss-api.service';
import { HowenVssAuthService } from './howen-vss-auth.service';
import { HowenVssService } from './howen-vss.service';
import { HowenVssWebSocketService } from './howen-vss-websocket.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [HowenVssApiService, HowenVssAuthService, HowenVssService, HowenVssWebSocketService],
  exports: [HowenVssApiService, HowenVssAuthService, HowenVssService, HowenVssWebSocketService],
})
export class HowenVssModule {}
