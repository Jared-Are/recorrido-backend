import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, UserRole } from './user.entity';
import { SupabaseService } from '../supabase/supabase.service'; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private supabaseService: SupabaseService, 
  ) {}

  findAll() {
    return this.usersRepository.find({ order: { nombre: 'ASC' } });
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  // --- CREAR USUARIO (Integrado con Supabase) ---
  async create(datos: Partial<User>) {
    try {
      // 1. Validaciones Locales
      const telefonoLimpio = datos.telefono && datos.telefono.trim() !== '' ? datos.telefono : undefined;
      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      // Validamos si ya existe en NUESTRA base de datos para no duplicar
      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) throw new BadRequestException(`Ya existe un usuario local con el teléfono ${telefonoLimpio}`);

      // 2. Preparar datos para Supabase (El Truco del Email)
      // Supabase EXIGE un email. Si no tenemos, inventamos uno usando el teléfono.
      const emailParaSupabase = datos.email || `${telefonoLimpio}@sin-email.com`;
      
      // Generamos una contraseña temporal aleatoria (el usuario la cambiará con el link)
      const passwordTemporal = `Temp${Math.floor(100000 + Math.random() * 900000)}`; 

      // 3. Crear en Supabase Auth (La Nube)
      const { data: authUser, error: authError } = await this.supabaseService.admin.createUser({
        email: emailParaSupabase,
        password: passwordTemporal,
        email_confirm: true, // Lo confirmamos automáticamente para que pueda entrar
        user_metadata: {
          nombre: datos.nombre,
          telefono: telefonoLimpio,
          rol: datos.rol || UserRole.TUTOR
        }
      });

      if (authError) {
        console.error("Error Supabase:", authError);
        // Si el error es que ya existe, intentamos recuperarlo para no bloquear el proceso
        throw new BadRequestException(`Error al crear en Supabase: ${authError.message}`);
      }

      // 4. Crear en Base de Datos Local
      // Generamos un username visual bonito (ej. juan.perez123)
      let usernameFinal = datos.username;
      if (!usernameFinal && datos.nombre) {
        const base = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.');
        const random = Math.floor(1000 + Math.random() * 9000);
        usernameFinal = `${base}${random}`;
      }

      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        id: authUser.user.id, // <--- CRUCIAL: Usamos el MISMO ID que nos dio Supabase
        username: usernameFinal,
        telefono: telefonoLimpio,
        email: emailParaSupabase, 
        rol: datos.rol || UserRole.TUTOR,
        estatus: UserStatus.ACTIVO,
        contrasena: undefined, // Ya no guardamos contraseñas aquí
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error creando usuario:", error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Error al crear usuario.");
    }
  }

  // --- GENERAR INVITACIÓN (Link Mágico) ---
  async generarTokenInvitacion(id: string) {
    // 1. Buscar usuario local
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado en BD local');

    // DETECTAMOS EL ENTORNO (Local o Producción)
    // Si tienes una variable FRONTEND_URL en tu .env úsala, si no, usa localhost por defecto
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';


    // 2. Pedir Link Mágico a Supabase
    // Usamos 'recovery' para que el usuario pueda poner su contraseña nueva al entrar
    const { data, error } = await this.supabaseService.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        // REDIRECCIÓN EXPLÍCITA:
        // Esto fuerza a Supabase a mandar al usuario a esta página específica
        // con el token en la URL.
        redirectTo: `${frontendUrl}/actualizar-password`
      }
    });

    if (error || !data.properties?.action_link) {
      console.error(error);
      throw new BadRequestException('No se pudo generar el link de Supabase');
    }
    
    const linkMagico = data.properties.action_link;

    // 3. Mensaje para WhatsApp
    const mensaje = `Hola ${user.nombre}, bienvenido al Recorrido Escolar.\n\n👤 Usuario: *${user.username}*\n🔗 Toca este enlace para crear tu contraseña y entrar:\n${linkMagico}`;

    return { 
      link: linkMagico, 
      telefono: user.telefono, 
      mensaje: mensaje 
    };
  }
}