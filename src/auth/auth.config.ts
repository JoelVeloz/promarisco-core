import { PrismaService } from '../prisma/prisma.service';
import { admin } from 'better-auth/plugins/admin';
import { betterAuth } from 'better-auth';
import { config } from '../config';
import { jwt } from 'better-auth/plugins/jwt';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { randomUUID } from 'crypto';

const prismaService = new PrismaService();

export const auth = betterAuth({
  trustedOrigins: [config.FRONTEND_CLIENT_URL, 'http://localhost:3000'],
  basePath: '/auth',
  database: prismaAdapter(prismaService, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  secret: config.AUTH_SECRET,
  plugins: [admin(), jwt()],
  advanced: {
    crossSubDomainCookies: { enabled: false },
    useSecureCookies: true,
    cookie: { sameSite: 'none', secure: true },
    defaultCookieAttributes: { sameSite: 'none', secure: true },
    database: { generateId: () => randomUUID() },
  },
});
