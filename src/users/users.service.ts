import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, UserRole } from './user.entity';
import { SupabaseService } from '../supabase/supabase.service'; 
import * as crypto from 'crypto'; // Importamos crypto para UUIDs

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

  // --- 1. CREAR USUARIO (Con Email Fantasma) ---
  async create(datos: Partial<User>) {
    try {
      // A. Validaciones Básicas
      const telefonoLimpio = datos.telefono?.trim();
      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) throw new BadRequestException(`Ya existe un usuario con el teléfono ${telefonoLimpio}`);

      // B. Generar Username y Email Fantasma
      let usernameFinal = datos.username;
      if (!usernameFinal && datos.nombre) {
        const base = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        usernameFinal = `${base}${random}`;
      }

      // EL TRUCO: Creamos un email interno que el usuario nunca ve
      const emailFantasma = `${usernameFinal}@recorrido.app`; 
      const passwordTemporal = `Temp${Math.random().toString(36).slice(-8)}`; 

      // C. Crear en Supabase (Fuente de Verdad de Seguridad)
      // Usamos el admin para crearlo sin enviar correo de confirmación real
      const { data: authUser, error: authError } = await this.supabaseService.admin.createUser({
        email: emailFantasma,
        password: passwordTemporal,
        email_confirm: true, // Lo marcamos confirmado para que pueda entrar
        user_metadata: { nombre: datos.nombre, rol: datos.rol }
      });

      if (authError) {
        console.error("Error Supabase:", authError);
        throw new BadRequestException("Error de seguridad al crear usuario.");
      }

      // D. Guardar en Base de Datos Local (Referencia)
      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        id: authUser.user.id, // Vinculamos con el ID seguro de Supabase
        username: usernameFinal,
        telefono: telefonoLimpio,
        email: emailFantasma, // Guardamos el email fantasma por si acaso
        rol: datos.rol || UserRole.TUTOR,
        estatus: UserStatus.INVITADO, 
        contrasena: undefined, // ¡YA NO GUARDAMOS LA CONTRASEÑA AQUÍ!
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error creando usuario:", error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Error al crear usuario.");
    }
  }

  // --- 2. GENERAR INVITACIÓN (Token Local) ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Token de un solo uso para validar que tiene permiso de poner contraseña
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.invitationToken = token;
    
    // Aseguramos que tenga username por si acaso (migración de datos viejos)
    if (!user.username) {
       const nombreBase = user.nombre ? user.nombre : 'usuario';
       const base = nombreBase.trim().toLowerCase().replace(/\s+/g, '.');
       user.username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await this.usersRepository.save(user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkActivacion = `${frontendUrl}/activar?token=${token}`;
    
    const mensaje = `Hola ${user.nombre}, bienvenido.\n\n👤 Tu Usuario: *${user.username}*\n🔐 Crea tu contraseña aquí: ${linkActivacion}`;

    return { link: linkActivacion, telefono: user.telefono, mensaje };
  }

  // --- 3. ACTIVAR CUENTA (Establecer Password en Supabase) ---
  async activarCuenta(token: string, contrasena: string) {
    // A. Validar Token Local
    const user = await this.usersRepository.findOneBy({ invitationToken: token });
    if (!user) throw new NotFoundException("El enlace de activación no es válido o ya fue usado.");

    // B. Actualizar Password en Supabase (SEGURIDAD REAL)
    const { error } = await this.supabaseService.admin.updateUserById(user.id, {
        password: contrasena
    });

    if (error) {
        console.error("Error actualizando password en Supabase:", error);
        throw new BadRequestException("No se pudo establecer la contraseña segura.");
    }

    // C. Actualizar Estado Local
    user.estatus = UserStatus.ACTIVO;
    user.invitationToken = null as any; // Quemamos el token

    return await this.usersRepository.save(user);
  }

  // --- 4. LOGIN (Proxy a Supabase) ---
  async login(username: string, contrasena: string) {
    // A. Buscar el email fantasma basado en el username
    const user = await this.usersRepository.findOne({ where: { username } });
    
    if (!user) throw new UnauthorizedException("Usuario no encontrado.");
    if (user.estatus !== UserStatus.ACTIVO) throw new UnauthorizedException("Cuenta no activada.");

    // B. Autenticar contra Supabase usando el email fantasma
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: user.email, // Usamos el email fantasma (juan@recorrido.app)
        password: contrasena
    });

    if (error) {
        throw new UnauthorizedException("Contraseña incorrecta.");
    }

    // C. Devolver sesión y datos del usuario
    return {
        ...user,
        access_token: data.session.access_token, // Token real de Supabase
    };
  }

  // --- RESCATE (ADMIN) ---
  async createAdminSeed() {
    const existe = await this.usersRepository.findOneBy({ username: 'admin' });
    if(existe) return { message: "Admin ya existe" };
    
    // Crear en Supabase directo
    const emailAdmin = "admin@recorrido.app";
    const passAdmin = "123456";
    
    let userId: any = crypto.randomUUID();
    
    try {
        const { data } = await this.supabaseService.admin.createUser({
            email: emailAdmin,
            password: passAdmin,
            email_confirm: true
        });
        if(data.user) userId = data.user.id;
    } catch(e) { console.log("Admin ya existía en Supabase, continuando..."); }

    const admin = this.usersRepository.create({
        id: userId,
        nombre: "Super Admin",
        username: "admin",
        telefono: "00000000",
        email: emailAdmin,
        rol: UserRole.PROPIETARIO,
        estatus: UserStatus.ACTIVO
    });

    await this.usersRepository.save(admin);
    return { message: "Admin creado: admin / 123456" };
  }
}