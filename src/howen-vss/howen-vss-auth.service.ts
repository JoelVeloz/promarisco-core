import * as fs from 'fs/promises';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';

import { HowenVssApiService } from './howen-vss-api.service';
import { config } from '../config';

interface AuthCredentials {
  pid: string;
  token: string;
  timestamp?: number;
}

@Injectable()
export class HowenVssAuthService {
  private readonly logger = new Logger(HowenVssAuthService.name);
  private readonly credentialsPath = path.join(process.cwd(), 'private', 'howen-vss-credentials.json');

  constructor(private readonly apiService: HowenVssApiService) {}

  async getCredentials(): Promise<AuthCredentials> {
    try {
      // Verificar si existe la carpeta private, si no crearla
      const privateDir = path.dirname(this.credentialsPath);
      try {
        await fs.access(privateDir);
      } catch {
        await fs.mkdir(privateDir, { recursive: true });
        this.logger.log(`📁 Carpeta 'private' creada`);
      }

      // Intentar leer el archivo de credenciales
      let needsRefresh = false;
      try {
        const fileContent = await fs.readFile(this.credentialsPath, 'utf-8');
        const credentials: AuthCredentials = JSON.parse(fileContent);

        // Verificar que las credenciales sean válidas (no contengan "----")
        if (credentials.pid && credentials.token && credentials.pid !== '----' && credentials.token !== '----') {
          // Verificar si las credenciales tienen más de 15 minutos
          const now = Date.now();
          const credentialsAge = credentials.timestamp ? now - credentials.timestamp : Infinity;
          const fifteenMinutesInMs = 15 * 60 * 1000;

          if (credentialsAge > fifteenMinutesInMs) {
            this.logger.log(`⏰ Credenciales expiradas (${Math.round(credentialsAge / 60000)} minutos), renovando...`);
            needsRefresh = true;
          } else {
            return { pid: credentials.pid, token: credentials.token };
          }
        } else {
          needsRefresh = true;
        }
      } catch {
        // El archivo no existe o está vacío, crear uno nuevo
        this.logger.log(`📝 Archivo de credenciales no encontrado, creando nuevo...`);
        needsRefresh = true;
      }

      // Si necesita refrescar, hacer login y guardar solo si fue exitoso
      const httpUrl = `http://${config.HOWEN_VSS_SERVER_IP}`;
      const loginResult = await this.apiService.login(config.HOWEN_VSS_USERNAME, config.HOWEN_VSS_PASSWORD, httpUrl);

      // Solo guardar si el login fue exitoso (no contiene "----")
      if (loginResult.pid !== '----' && loginResult.token !== '----') {
        const credentials: AuthCredentials = {
          ...loginResult,
          timestamp: Date.now(),
        };
        await fs.writeFile(this.credentialsPath, JSON.stringify(credentials, null, 2), 'utf-8');
        this.logger.log(`✅ Credenciales guardadas en ${this.credentialsPath}`);
      } else {
        this.logger.warn(`⚠️ Login fallido, no se guardaron credenciales`);
      }

      return { pid: loginResult.pid, token: loginResult.token };
    } catch (error) {
      this.logger.error(`❌ Error al obtener credenciales: ${error.message}`);
      return { pid: '----', token: '----' };
    }
  }
}
