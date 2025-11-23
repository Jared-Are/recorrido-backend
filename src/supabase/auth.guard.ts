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
    const path = request.path; // Obtenemos la URL que se está visitando

    // --- 🚨 LISTA BLANCA MANUAL (FUERZA BRUTA) ---
    // Esto asegura que estas rutas SIEMPRE sean públicas, falle lo que falle.
    const publicPaths = [
        '/',                  // Raíz
        '/users/seed',        // Botón de Rescate
        '/users/login',       // Login
        '/users/activar',     // Activación
        '/favicon.ico'        // Icono
    ];

    // Si la URL empieza con alguna de las públicas, dejamos pasar
    // Usamos .some y .startsWith para cubrir casos con query params
    if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
        console.log(`🔓 Acceso Libre (Lista Blanca): ${path}`);
        return true;
    }
    // ---------------------------------------------

    // 1. Revisar decorador @Public (Método normal)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) return true;

    // 2. Buscar token
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      console.warn(`🔒 Bloqueo: Falta token en ${request.method} ${path}`);
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