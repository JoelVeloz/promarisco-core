import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { auth } from './auth.config';

@Injectable()
export class DefaultDataService implements OnModuleInit {
  private readonly logger = new Logger(DefaultDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.createDefaultUser('proyectos@grupoalconsa.com', 'Pro2025@!', 'Usuario Proyectos');
    await this.createDefaultUser('syscloud.saas@gmail.com', 'Pro2025@!', 'SysCloud Team');
  }

  async createDefaultUser(defaultEmail: string, defaultPassword: string, defaultName: string) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findUnique({ where: { email: defaultEmail } });

      if (existingUser) {
        this.logger.log(`Usuario por defecto ya existe: ${defaultEmail}`);
        return existingUser;
      }

      // Usar la API de Better Auth para registrar el usuario
      const result = await auth.api.signUpEmail({
        body: { email: defaultEmail, password: defaultPassword, name: defaultName },
      });

      this.logger.log(`Usuario por defecto creado exitosamente: ${defaultEmail}`);
      return result.user;
    } catch (error) {
      this.logger.error(`Error al crear usuario por defecto: ${error.message}`, error.stack);
      throw error;
    }
  }
}
