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

  // --- BUSCAR EMAIL Y ROL PARA LOGIN ---
  async findEmailByIdentifier(identifier: string) {
    const user = await this.usersRepository.findOne({
      where: [
        { username: identifier },
        { telefono: identifier },
        { email: identifier }
      ],
      select: ['email', 'rol'] 
    });

    if (!user) throw new NotFoundException('Usuario no encontrado en el sistema.');
    return { email: user.email, rol: user.rol };
  }

  // --- CREAR USUARIO ---
  async create(datos: Partial<User>) {
    try {
      const telefonoLimpio = datos.telefono && datos.telefono.trim() !== '' ? datos.telefono : undefined;
      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      // 1. Verificar duplicado local
      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) throw new BadRequestException(`Ya existe un usuario local con el teléfono ${telefonoLimpio}`);

      const emailParaSupabase = datos.email || `${telefonoLimpio}@sin-email.com`;
      const passwordTemporal = `Temp${Math.floor(100000 + Math.random() * 900000)}`; 

      // 2. Crear en Supabase
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

      // 3. Generar username
      let usernameFinal = datos.username;
      if (!usernameFinal && datos.nombre) {
        const base = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.');
        const random = Math.floor(1000 + Math.random() * 9000);
        usernameFinal = `${base}${random}`;
      }

      // 4. Guardar en Local usando el ID de Supabase
      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        id: authUser.user.id, // ¡IMPORTANTE! Sincronizamos IDs
        username: usernameFinal,
        telefono: telefonoLimpio,
        email: emailParaSupabase, 
        rol: datos.rol || UserRole.TUTOR,
        estatus: UserStatus.ACTIVO, 
        contrasena: undefined,
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error creando usuario:", error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Error al crear usuario.");
    }
  }

  // --- GENERAR INVITACIÓN (CON AUTO-REPARACIÓN) ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado en BD local');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // INTENTO 1: Generar Link
    let { data, error } = await this.supabaseService.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: { redirectTo: `${frontendUrl}/actualizar-password` }
    });

    // AUTO-REPARACIÓN: Si el usuario no existe en Supabase (data vieja), lo creamos
    if (error && error.message.includes('User not found')) {
        console.log(`⚠️ Usuario ${user.email} no encontrado en Supabase. Reparando...`);
        
        // Lo creamos silenciosamente en Supabase
        const { error: createError } = await this.supabaseService.admin.createUser({
            email: user.email,
            password: `Temp${Math.random().toString().slice(-8)}`, // Pass temporal cualquiera
            email_confirm: true,
            user_metadata: { nombre: user.nombre, telefono: user.telefono }
        });

        if (createError) {
            console.error("❌ Falló la reparación:", createError);
            throw new BadRequestException(`Error de sincronización: ${createError.message}`);
        }

        // INTENTO 2: Generar Link de nuevo
        const retry = await this.supabaseService.admin.generateLink({
            type: 'recovery',
            email: user.email,
            options: { redirectTo: `${frontendUrl}/actualizar-password` }
        });
        data = retry.data;
        error = retry.error;
    }

    if (error || !data.properties?.action_link) {
      console.error("❌ Error final Supabase:", error);
      throw new BadRequestException(`No se pudo generar el link: ${error?.message || 'Error desconocido'}`);
    }
    
    const linkMagico = data.properties.action_link;
    const mensaje = `Hola ${user.nombre}, bienvenido al Recorrido Escolar.\n\n👤 Usuario: *${user.username}*\n🔗 Toca este enlace para crear tu contraseña y entrar:\n${linkMagico}`;

    return { link: linkMagico, telefono: user.telefono, mensaje: mensaje };
  }
}