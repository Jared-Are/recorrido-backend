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

  // --- MEJORADO: BUSCAR EMAIL Y ROL PARA LOGIN ---
  async findEmailByIdentifier(identifier: string) {
    // Buscamos en la BD local por username, teléfono O email
    const user = await this.usersRepository.findOne({
      where: [
        { username: identifier },
        { telefono: identifier },
        { email: identifier } // También buscamos por email si el usuario lo escribió
      ],
      select: ['email', 'rol'] // <--- IMPORTANTE: Recuperamos el ROL también
    });

    if (!user) throw new NotFoundException('Usuario no encontrado en el sistema.');

    // Devolvemos el email (para Supabase) y el rol (para redirigir)
    return { email: user.email, rol: user.rol };
  }

  // --- CREAR USUARIO (Integrado con Supabase) ---
  async create(datos: Partial<User>) {
    try {
      const telefonoLimpio = datos.telefono && datos.telefono.trim() !== '' ? datos.telefono : undefined;
      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) throw new BadRequestException(`Ya existe un usuario local con el teléfono ${telefonoLimpio}`);

      const emailParaSupabase = datos.email || `${telefonoLimpio}@sin-email.com`;
      const passwordTemporal = `Temp${Math.floor(100000 + Math.random() * 900000)}`; 

      const { data: authUser, error: authError } = await this.supabaseService.admin.createUser({
        email: emailParaSupabase,
        password: passwordTemporal,
        email_confirm: true,
        user_metadata: {
          nombre: datos.nombre,
          telefono: telefonoLimpio,
          rol: datos.rol || UserRole.TUTOR
        }
      });

      if (authError) {
        console.error("Error Supabase:", authError);
        throw new BadRequestException(`Error al crear en Supabase: ${authError.message}`);
      }

      let usernameFinal = datos.username;
      if (!usernameFinal && datos.nombre) {
        const base = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.');
        const random = Math.floor(1000 + Math.random() * 9000);
        usernameFinal = `${base}${random}`;
      }

      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        id: authUser.user.id,
        username: usernameFinal,
        telefono: telefonoLimpio,
        email: emailParaSupabase, 
        rol: datos.rol || UserRole.TUTOR,
        estatus: UserStatus.ACTIVO, // Nacen activos
        contrasena: undefined,
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error creando usuario:", error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Error al crear usuario.");
    }
  }

  // --- GENERAR INVITACIÓN ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado en BD local');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const { data, error } = await this.supabaseService.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${frontendUrl}/actualizar-password`
      }
    });

    if (error || !data.properties?.action_link) {
      throw new BadRequestException('No se pudo generar el link de Supabase');
    }
    
    const linkMagico = data.properties.action_link;
    const mensaje = `Hola ${user.nombre}, bienvenido al Recorrido Escolar.\n\n👤 Usuario: *${user.username}*\n🔗 Toca este enlace para crear tu contraseña y entrar:\n${linkMagico}`;

    return { link: linkMagico, telefono: user.telefono, mensaje: mensaje };
  }
}