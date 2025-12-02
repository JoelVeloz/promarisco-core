import * as dotenv from 'dotenv';

import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // General
  PORT: z.number().int().positive().default(3000),
  DATABASE_URL: z.url(),

  // Howen VSS
  HOWEN_VSS_SERVER_IP: z.string(),
  HOWEN_VSS_USERNAME: z.string(),
  HOWEN_VSS_PASSWORD: z.string(),
});

export const config = (() => {
  // Debug: ver el valor raw de la variable de entorno

  const { success, data, error } = envSchema.safeParse(process.env);

  if (!success) {
    console.error('❌ Variables faltantes:');
    error.issues.forEach(({ path, message }) => console.error(`   ${path.join('.')}: ${message}`));
    process.exit(1);
  }

  return data;
})();
