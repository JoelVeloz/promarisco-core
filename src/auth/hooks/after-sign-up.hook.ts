// import { AfterHook, Hook } from '@thallesp/nestjs-better-auth';
// import type { AuthHookContext, UserSession } from '@thallesp/nestjs-better-auth';
// import { Injectable, InternalServerErrorException } from '@nestjs/common';

// @Hook()
// @Injectable()
// export class AfterSignUpHook {
//   @AfterHook('/sign-up/email')
//   async handle(ctx: AuthHookContext) {
//     const user = ctx.context.newSession as UserSession;
//     console.log('🚀 Ejecutando función después de registrarse:', user);
//     if (!user) throw new InternalServerErrorException('User not found');
//     // await this.createWallets(user.user.id);
//   }
// }
