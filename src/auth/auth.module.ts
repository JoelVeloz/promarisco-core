import { AuthGuard, AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { APP_GUARD } from '@nestjs/core';
import { AfterSignUpHook } from './hooks/after-sign-up.hook';
import { Module } from '@nestjs/common';
import { auth } from './auth.config';

@Module({
  imports: [BetterAuthModule.forRoot(auth)],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }, AfterSignUpHook],
})
export class AuthModule {}
