import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    // Inicializamos el cliente con la Service Role Key para tener permisos de administrador
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') ?? '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false, // Importante: El backend no mantiene sesión
        },
      },
    );
  }

  // Getter para acceder al cliente desde otros servicios
  get admin() {
    return this.supabase.auth.admin;
  }
  
  get client() {
    return this.supabase;
  }
}