import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from './supabase.service';
import { IS_PUBLIC_KEY } from '../common/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Si la ruta es pública, pase adelante
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) return true;

    // 2. Buscar el token en la cabecera
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      console.warn(`🔒 Bloqueo: Falta token en ${request.method} ${request.url}`);
      throw new UnauthorizedException('No se encontró token de autenticación');
    }

    try {
      // 3. Validar con Supabase
      const { data: { user }, error } = await this.supabase.client.auth.getUser(token);
      
      if (error || !user) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

      // 4. ¡Éxito! Adjuntamos el usuario al request
      request.user = user; 
      return true;
    } catch (err) {
      throw new UnauthorizedException('Sesión no válida');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}