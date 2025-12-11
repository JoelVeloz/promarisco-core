import * as dotenv from 'dotenv';

import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // General
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  FRONTEND_CLIENT_URL: z.url(),
  // Auth
  AUTH_SECRET: z.string(),
  BASE_URL: z.url(),
  // Wailon
  WAILON_TOKEN: z.string(),
  // SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  // Email Provider Selection
  USE_RESEND: z.coerce.boolean().default(true),
});

export const config = (() => {
  const { success, data, error } = envSchema.safeParse(process.env);

  if (!success) {
    console.error('❌ Variables faltantes:');
    error.issues.forEach(({ path, message }) => console.error(`   ${path.join('.')}: ${message}`));
    process.exit(1);
  }

  return data;
})();
