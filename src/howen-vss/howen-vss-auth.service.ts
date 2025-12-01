import { Injectable } from '@nestjs/common';

interface AuthCredentials {
  pid: string;
  token: string;
}

@Injectable()
export class HowenVssAuthService {
  static async getCredentials(): Promise<AuthCredentials> {
    // TODO: Implementar lógica para obtener pid y token juntos
    return {
      pid: '',
      token: '',
    };
  }
}
