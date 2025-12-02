import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  status: number;
  msg?: string;
  data?: {
    token: string;
    pid: string;
  };
}

@Injectable()
export class HowenVssApiService {
  private readonly logger = new Logger(HowenVssApiService.name);

  async login(username: string, password: string, httpUrl: string): Promise<{ pid: string; token: string }> {
    try {
      const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
      const loginData: LoginRequest = { username, password: hashedPassword };

      const response = await fetch(`${httpUrl}/vss/user/apiLogin.action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result: LoginResponse = await response.json();

      if (result.status === 10000 && result.data) {
        return { pid: result.data.pid, token: result.data.token };
      }

      throw new Error(result.msg || `Error en login: Status ${result.status}`);
    } catch (error) {
      console.error(error);
      this.logger.error(`Error en login: ${error.message}`);
      return { pid: '----', token: '----' };
    }
  }
}
