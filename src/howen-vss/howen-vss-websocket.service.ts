import * as WebSocket from 'ws';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { HowenVssAuthService } from './howen-vss-auth.service';
import { config } from '../config';

interface WebSocketMessage {
  action?: string | number;
  payload?: any;
  [key: string]: any;
}

interface HowenWebSocketOptions {
  url: string;
  username: string;
  pid: string;
  token: string;
}

@Injectable()
export class HowenVssWebSocketService implements OnModuleInit {
  private readonly logger = new Logger(HowenVssWebSocketService.name);
  private ws: WebSocket | null = null;
  private options?: HowenWebSocketOptions;

  async onModuleInit() {
    const url = `http://${config.HOWEN_VSS_SERVER_IP}`;
    const username = config.HOWEN_VSS_USERNAME;
    const { pid, token } = await HowenVssAuthService.getCredentials();

    this.connect({ url, username, pid, token });
  }

  connect(options: HowenWebSocketOptions): void {
    this.options = options;
    const { url, username, pid, token } = options;

    if (!pid || !token) {
      this.logger.warn('⚠️ No se puede establecer conexión sin pid/token');
      return;
    }

    this.disconnect();

    const connectionUrl = `${url}/ws`;
    this.logger.log(`🔌 Conectando a ${connectionUrl}`);

    try {
      this.ws = new WebSocket(connectionUrl);

      this.ws.on('open', () => {
        this.logger.log('✅ Conexión establecida');
        this.authenticate(username, pid, token);
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.logger.error(`❌ Error al parsear mensaje: ${data.toString()}`);
        }
      });

      this.ws.on('close', () => {
        this.logger.warn('⚠️ Conexión cerrada');
      });

      this.ws.on('error', (error: Error) => {
        this.logger.error(`❌ Error: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`❌ Error al crear conexión: ${(error as Error).message}`);
    }
  }

  send(data: WebSocketMessage | string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
    } else {
      this.logger.warn('⚠️ WebSocket no conectado');
    }
  }

  // para la hielera.
  // por equipo por placa y por fecha,

  // grupo de manfrisco, hielo11 hieleras,grupo de camaroneras., solo entrada y salida.

  disconnect(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }

  private authenticate(username: string, pid: string, token: string): void {
    this.send({ action: 80000, payload: { username, pid, token } });
  }

  private async handleMessage(message: WebSocketMessage): Promise<void> {
    const action = String(message.action ?? '');

    switch (action) {
      case '80000':
        this.handleLoginResponse(message.payload);
        console.log('80000:', message.payload);
        break;

      case '80001':
        this.logger.debug('✅ Confirmación de suscripción recibida');
        console.log('80001:', message.payload);
        break;

      case '80003':
        console.log('80003:', message.payload);
        break;

      case '80004':
        console.log('80004:', message.payload);
        break;

      case '80005':
        console.log('80005:', message.payload);
        break;

      case '80009':
        this.logger.debug('✅ Heartbeat confirmado por el servidor');
        console.log('80009:', message.payload);
        break;

      default:
        this.logger.debug(`Mensaje de tipo ${action} recibido`);
        console.log(`Mensaje ${action}:`, message.payload);
    }
  }

  private handleLoginResponse(payload: any): void {
    const result = payload?.result ?? payload?.Result;
    if (result === 'success') {
      this.logger.log('✅ Autenticación exitosa');
      this.send({ action: 80001, payload: '' });
    } else {
      this.logger.error(`❌ Autenticación fallida: ${payload?.msg ?? ''}`);
    }
  }
}
