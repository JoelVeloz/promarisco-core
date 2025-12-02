import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'PM Core API',
      version: '1.0.0',
    };
  }
}
