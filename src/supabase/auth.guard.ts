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
    const request = context.switchToHttp().getRequest();
    const path = request.path; 

    // --- 🚨 LISTA BLANCA MANUAL (SOLO RUTAS SEGURAS) ---
    const publicPaths = [
        '/',                  // Raíz (Health check)
        '/users/login',       // Login
        '/users/lookup',      // Lookup (Agregada)
        '/users/activar',     // Activación
        '/favicon.ico'        
        // ❌ '/users/seed' ELIMINADO
    ];

    if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
        return true;
    }
    // ---------------------------------------------

    // 1. Revisar decorador @Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) return true;

    // 2. Buscar token
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      // console.warn(`🔒 Bloqueo: Falta token en ${request.method} ${path}`); // Opcional: comentar para menos ruido
      throw new UnauthorizedException('No se encontró token de autenticación');
    }

    try {
      const { data: { user }, error } = await this.supabase.client.auth.getUser(token);
      
      if (error || !user) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

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