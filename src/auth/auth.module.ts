import { AuthGuard, AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { APP_GUARD } from '@nestjs/core';
import { AfterSignUpHook } from './hooks/after-sign-up.hook';
import { DefaultDataService } from './default-data.service';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { auth } from './auth.config';

@Module({
  imports: [BetterAuthModule.forRoot({ auth }), PrismaModule],
  // providers: [{ provide: APP_GUARD, useClass: AuthGuard }, AfterSignUpHook, DefaultDataService],
  providers: [AfterSignUpHook, DefaultDataService],
})
export class AuthModule {}
