import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { Request } from 'express';
import { config } from '../config';

@Injectable()
export class CookieSessionApiGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Validar que existan cookies en la petición
      const cookies = this.extractCookies(request);
      if (!cookies || cookies.length === 0) {
        throw new UnauthorizedException('No se encontraron cookies de sesión');
      }

      // Consultar la API de autenticación para validar la sesión mediante cookies
      const sessionData = await this.validateSessionWithApi(request, cookies);

      if (!sessionData) throw new UnauthorizedException('Sesión inválida');

      // Adjuntar la sesión al request
      (request as { session?: unknown })['session'] = sessionData;

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al validar la sesión';
      throw new UnauthorizedException(errorMessage);
    }
  }

  /**
   * Extrae y formatea las cookies de la petición
   */
  private extractCookies(request: Request): string {
    // Obtener cookies del header
    const cookieHeader = request.headers.cookie || '';

    // También verificar si hay cookies parseadas en el request (por middleware de cookies)
    const parsedCookies = (request as { cookies?: Record<string, string> }).cookies;

    if (parsedCookies && Object.keys(parsedCookies).length > 0) {
      // Si hay cookies parseadas, reconstruir el header de cookies
      return Object.entries(parsedCookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    return cookieHeader;
  }

  /**
   * Valida la sesión llamando a la API de autenticación usando cookies
   */
  private async validateSessionWithApi(request: Request, cookies: string): Promise<{ session: unknown; user: unknown }> {
    try {
      // Llamar a la API de autenticación pasando las cookies de sesión
      const response = await fetch(`${config.BASE_URL}/auth/get-session`, {
        method: 'GET',
        headers: {
          Cookie: cookies,
          // Incluir otros headers relevantes para mantener el contexto
          'User-Agent': request.headers['user-agent'] || '',
          Accept: request.headers.accept || 'application/json',
        },
        credentials: 'include', // Asegurar que las cookies se incluyan en la petición
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error validating session:', response.status, errorText);
        throw new UnauthorizedException('Sesión inválida o expirada');
      }

      const data = (await response.json()) as { session?: unknown; user?: unknown };

      if (!data || !data.session || !data.user) {
        throw new UnauthorizedException('Respuesta de sesión inválida');
      }

      return data as { session: unknown; user: unknown };
    } catch (error) {
      console.error('Error en validateSessionWithApi:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error al validar sesión con el servidor de autenticación');
    }
  }
}
