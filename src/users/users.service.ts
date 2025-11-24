import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './user.entity';
import { SupabaseService } from '../supabase/supabase.service'; 
import * as crypto from 'crypto'; 

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

  // --- ACTUALIZAR USUARIO (Para editar Tutor/Personal) ---
  async update(id: string, changes: Partial<User>) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException("Usuario no encontrado");

    // Si cambia el teléfono, verificamos que no esté repetido en otro usuario
    if (changes.telefono && changes.telefono !== user.telefono) {
        const existe = await this.usersRepository.findOneBy({ telefono: changes.telefono });
        if (existe) throw new BadRequestException("Ese teléfono ya está en uso por otro usuario.");
    }

    this.usersRepository.merge(user, changes);
    return await this.usersRepository.save(user);
  }

  // --- LOOKUP (Paso 1 del Login) ---
  async lookupUser(identifier: string) {
    const user = await this.usersRepository.findOne({
        where: [
            { username: identifier },
            { telefono: identifier }
        ]
    });

    if (!user) throw new NotFoundException("Usuario no encontrado");
    
    return { 
        email: user.email, 
        rol: user.rol 
    };
  }

  // --- CREAR USUARIO (Soporta creación desde Alumnos y Personal) ---
  async create(datos: Partial<User>) {
    try {
      const telefonoLimpio = datos.telefono?.trim();
      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      // Verificamos si ya existe (aunque PersonalService ya lo valida, es doble seguridad)
      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) {
          // Si ya existe, retornamos el existente para no fallar (caso re-contratación o tutor que se vuelve empleado)
          return existe; 
      }

      let usernameFinal = datos.username;
      if (!usernameFinal && datos.nombre) {
        // Generar username base: juan.perez + 4 digitos
        const base = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        usernameFinal = `${base}${random}`;
      }

      const emailFantasma = `${usernameFinal}@recorrido.app`; 
      const passwordTemporal = `Temp${Math.random().toString(36).slice(-8)}`; 
      let authUserId: string = crypto.randomUUID(); 
      
      // 1. Crear en Supabase Auth
      try {
          const { data: authUser } = await this.supabaseService.admin.createUser({
            email: emailFantasma,
            password: passwordTemporal,
            email_confirm: true,
            user_metadata: { nombre: datos.nombre, rol: datos.rol }
          });
          if (authUser?.user) authUserId = authUser.user.id;
      } catch (e: any) { 
          console.error("Supabase create warning:", e.message); 
      }

      // 2. Guardar en Base de Datos Local
      const nuevoUsuario = this.usersRepository.create({
        ...datos, // Aquí entra vehiculoId si viene del PersonalService
        id: authUserId, 
        username: usernameFinal,
        telefono: telefonoLimpio,
        email: emailFantasma, 
        rol: datos.rol || 'tutor',
        estatus: UserStatus.INVITADO, 
        contrasena: undefined, 
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error creando usuario:", error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Error al crear usuario.");
    }
  }

  // --- GENERAR INVITACIÓN (Link de WhatsApp) ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.invitationToken = token;
    
    // Asegurar username si falta
    if (!user.username) {
       const nombreBase = user.nombre ? user.nombre : 'usuario';
       const base = nombreBase.trim().toLowerCase().replace(/\s+/g, '.');
       user.username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await this.usersRepository.save(user);

    // Usamos variable de entorno o fallback a Vercel
    let frontendUrl = process.env.FRONTEND_URL || 'https://recorrido-lac.vercel.app';
    
    // Asegurar https://
    if (!frontendUrl.startsWith('http')) {
        frontendUrl = `https://${frontendUrl}`;
    }
    // Quitar barra final si existe
    if (frontendUrl.endsWith('/')) {
        frontendUrl = frontendUrl.slice(0, -1);
    }
    
    const linkActivacion = `${frontendUrl}/activar?token=${token}`;
    
    const mensaje = `Hola ${user.nombre}, bienvenido.\n\n👤 Tu Usuario: *${user.username}*\n🔐 Crea tu contraseña aquí:\n${linkActivacion}`;

    return { link: linkActivacion, telefono: user.telefono, mensaje };
  }

  // --- ACTIVAR CUENTA (Establecer Password) ---
  async activarCuenta(token: string, contrasena: string) {
    const user = await this.usersRepository.findOneBy({ invitationToken: token });
    if (!user) throw new NotFoundException("Link inválido o expirado.");

    try {
        await this.supabaseService.admin.updateUserById(user.id, { password: contrasena });
    } catch(e) { console.error("Error al sincronizar password con Supabase"); }

    user.estatus = UserStatus.ACTIVO;
    user.invitationToken = null as any; // Quemamos el token para que no se use de nuevo

    return await this.usersRepository.save(user);
  }

  // --- LOGIN ---
  async login(username: string, contrasena: string) {
    if (!username) throw new BadRequestException("Username es obligatorio");

    const query = this.usersRepository.createQueryBuilder("user")
      .where("user.username = :username", { username })
      .addSelect("user.contrasena");

    const user = await query.getOne();

    if (!user) throw new UnauthorizedException("Usuario no encontrado.");
    if (user.estatus !== UserStatus.ACTIVO) throw new UnauthorizedException("Cuenta no activada.");

    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: user.email, 
        password: contrasena
    });

    if (error) {
        console.error(`Login fallido para usuario: ${username}. Razón: ${error.message}`);
        throw new UnauthorizedException("Contraseña incorrecta.");
    }

    const { contrasena: pass, invitationToken, ...result } = user;

    return { 
        ...result, 
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token 
    };
  }

  // --- ADMIN SEED (Deshabilitado en producción) ---
  async createAdminSeed() {
    return { message: "Función deshabilitada por seguridad en producción" };
  }
}