import { HowenVssAuthService } from './howen-vss-auth.service';
import { HowenVssService } from './howen-vss.service';
import { HowenVssWebSocketService } from './howen-vss-websocket.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [HowenVssService, HowenVssWebSocketService, HowenVssAuthService],
  exports: [HowenVssService, HowenVssWebSocketService, HowenVssAuthService],
})
export class HowenVssModule {}
