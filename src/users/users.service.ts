import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { auth } from '../auth/auth.config';
import { config } from '../config';

@Injectable()
export class UsersService {
  private readonly adminEmail = 'proyectos@grupoalconsa.com';
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(`El usuario con el correo ${createUserDto.email} ya existe`);
      }

      // Usar Better Auth para crear el usuario
      const result = await auth.api.signUpEmail({
        body: { email: createUserDto.email, password: createUserDto.password, name: createUserDto.name },
      });

      if (!result.user) {
        throw new BadRequestException('Error al crear el usuario');
      }

      return result.user as User;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear el usuario: ${error.message}`);
    }
  }

  async findAll(query: FindAllUsersDto): Promise<PaginationResult<User>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const isAdmin = await this.prisma.user.findUnique({ where: { id } });

    if (isAdmin?.email === this.adminEmail) {
      throw new ConflictException('No se puede actualizar el usuario administrador');
    }
    // Verificar que el usuario existe
    const existingUser = await this.prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailInUse) {
        throw new ConflictException(`El correo ${updateUserDto.email} ya está en uso`);
      }
    }

    // Actualizar usando Prisma directamente
    // Better Auth no tiene un método directo de actualización de usuario
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.name && { name: updateUserDto.name }),
        ...(updateUserDto.email && { email: updateUserDto.email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const isAdmin = await this.prisma.user.findUnique({ where: { id } });
    if (isAdmin?.email === this.adminEmail) {
      throw new ConflictException('No se puede eliminar el usuario administrador');
    }
    // Verificar que el usuario existe
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await this.prisma.user.delete({ where: { id } });
    // account
    await this.prisma.account.deleteMany({ where: { userId: id } });
    // session
    await this.prisma.session.deleteMany({ where: { userId: id } });
  }
}
