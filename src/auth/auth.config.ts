import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { admin } from 'better-auth/plugins/admin';
import { betterAuth } from 'better-auth';
import { config } from '../config';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { jwt } from 'better-auth/plugins/jwt';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { randomUUID } from 'crypto';

const prismaService = new PrismaService();
const emailService = new EmailService();

export const auth = betterAuth({
  // baseURL: config.FRONTEND_CLIENT_URL,
  trustedOrigins: [config.FRONTEND_CLIENT_URL, 'http://localhost:3000'],
  basePath: '/auth',
  database: prismaAdapter(prismaService, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // sendResetPassword: async ({ user, url }) => {
    //   await emailService.sendResetToken(user.name, user.email, url);
    // },
  },

  secret: config.AUTH_SECRET,
  plugins: [
    admin(),
    jwt(),
    // emailOTP({
    //   otpLength: 8,
    //   expiresIn: 600,
    //   sendVerificationOTP: async ({ email, otp, type }) => {
    //     await emailService.sendOTP(email, otp, type);
    //   },
    // }),
  ],
  hooks: {},
  advanced: {
    crossSubDomainCookies: { enabled: false },
    useSecureCookies: true,
    cookie: { sameSite: 'none', secure: true },
    defaultCookieAttributes: { sameSite: 'none', secure: true },
    database: { generateId: false },
  },
});
