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
    // 1. Ruta Pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) return true;

    // 2. Extracción de Token
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      console.warn(`🔒 AuthGuard: Bloqueo por falta de token en ${request.url}`);
      throw new UnauthorizedException('No se encontró token de autenticación');
    }

    try {
      // 3. Validación con Supabase
      const { data: { user }, error } = await this.supabase.client.auth.getUser(token);
      
      if (error || !user) {
        console.error('❌ AuthGuard: Token inválido:', error?.message);
        throw new UnauthorizedException('Token inválido o expirado');
      }

      // Log de éxito (para confirmar que PASÓ el guardia)
      console.log(`✅ AuthGuard: Acceso permitido a ${user.email} -> ${request.method} ${request.url}`);
      
      request.user = user; 
      return true;
    } catch (err) {
      console.error('🔥 AuthGuard: Error inesperado validando sesión', err);
      throw new UnauthorizedException('Error validando sesión');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}