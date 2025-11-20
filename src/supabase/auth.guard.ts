import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // <--- IMPORTAR REFLECTOR
import { SupabaseService } from './supabase.service';
import { IS_PUBLIC_KEY } from '../common/public.decorator'; // <--- IMPORTAR TU DECORADOR

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private reflector: Reflector // <--- INYECTAR REFLECTOR
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Revisar si la ruta es Pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true; // Dejar pasar sin token
    }

    // 2. Si no es pública, validamos el token
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
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
      throw new UnauthorizedException('Error validando sesión');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}