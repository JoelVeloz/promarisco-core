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
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_FROM: z.string().optional(),
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
