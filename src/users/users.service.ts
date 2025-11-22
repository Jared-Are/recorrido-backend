import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, UserRole } from './user.entity';
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

  // --- 1. CREAR USUARIO ---
  async create(datos: Partial<User>) {
    try {
      const telefonoLimpio = datos.telefono?.trim();
      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) throw new BadRequestException(`Ya existe un usuario con el teléfono ${telefonoLimpio}`);

      let usernameFinal = datos.username;
      if (!usernameFinal && datos.nombre) {
        const base = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        usernameFinal = `${base}${random}`;
      }

      const emailFantasma = `${usernameFinal}@recorrido.app`; 
      const passwordTemporal = `Temp${Math.random().toString(36).slice(-8)}`; 

      let authUserId: string = crypto.randomUUID(); 
      
      try {
          const { data: authUser } = await this.supabaseService.admin.createUser({
            email: emailFantasma,
            password: passwordTemporal,
            email_confirm: true,
            user_metadata: { nombre: datos.nombre, rol: datos.rol }
          });
          
          if (authUser?.user) authUserId = authUser.user.id;
      } catch (e) { console.log("Supabase create skipped or failed", e); }

      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        id: authUserId,
        username: usernameFinal,
        telefono: telefonoLimpio,
        email: emailFantasma, 
        rol: datos.rol || UserRole.TUTOR,
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

  // --- 2. GENERAR INVITACIÓN ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.invitationToken = token;
    
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

  // --- 3. ACTIVAR CUENTA ---
  async activarCuenta(token: string, contrasena: string) {
    const user = await this.usersRepository.findOneBy({ invitationToken: token });
    if (!user) throw new NotFoundException("Link inválido.");

    try {
        // Importante: Al activar, sincronizamos la contraseña en Supabase
        await this.supabaseService.admin.updateUserById(user.id, { password: contrasena });
    } catch(e) { console.log("Sync pass failed"); }

    user.estatus = UserStatus.ACTIVO;
    user.invitationToken = null as any;

    return await this.usersRepository.save(user);
  }

  // --- 4. LOGIN ---
  async login(username: string, contrasena: string) {
    const user = await this.usersRepository.createQueryBuilder("user")
      .where("user.username = :username", { username })
      .addSelect("user.contrasena") 
      .getOne();

    if (!user) throw new UnauthorizedException("Usuario no encontrado.");
    if (user.estatus !== UserStatus.ACTIVO) throw new UnauthorizedException("Cuenta no activada.");

    // Login contra Supabase
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: user.email, 
        password: contrasena
    });

    if (error) {
        // Si falla en Supabase, podría ser por desincronización. 
        // Opcional: Si la contraseña local coincide, forzamos login devolviendo token manual o relanzamos error.
        console.error("Error Supabase Login:", error.message);
        throw new UnauthorizedException("Contraseña incorrecta.");
    }

    return { ...user, access_token: data.session.access_token };
  }

  // --- 🚨 RESCATE TOTAL (Sincronización de IDs) ---
  async createAdminSeed() {
    const emailAdmin = "admin@recorrido.app";
    const passAdmin = "123456";
    let supabaseId: string | null = null;

    // 1. Buscar o Crear en Supabase para obtener el ID REAL
    try {
        // Intentamos listar usuarios (solo si tenemos service_role key)
        // O simplemente intentamos crear y si falla porque existe, no pasa nada, pero necesitamos el ID.
        // La forma más fácil sin listar es crear.
        const { data, error } = await this.supabaseService.admin.createUser({
            email: emailAdmin,
            password: passAdmin,
            email_confirm: true,
            user_metadata: { rol: 'propietario' }
        });

        if (data.user) {
            supabaseId = data.user.id;
            console.log("✅ Admin creado en Supabase. ID:", supabaseId);
        } else if (error) {
            console.log("ℹ️ Admin ya existe en Supabase. Intentando recuperar ID...");
            // Si ya existe, no podemos obtener el ID fácilmente sin hacer login o list users.
            // Hacemos un login temporal para sacar el ID.
             const { data: loginData } = await this.supabaseService.client.auth.signInWithPassword({
                email: emailAdmin,
                password: passAdmin
            });
            if (loginData.user) supabaseId = loginData.user.id;
        }
    } catch (e) {
        console.error("Error conectando con Supabase:", e);
    }

    if (!supabaseId) {
        return { message: "❌ Error crítico: No se pudo obtener el ID de Supabase. Verifica credenciales." };
    }

    // 2. Buscar admin local
    let adminLocal = await this.usersRepository.findOneBy({ username: 'admin' });
    
    if (adminLocal) {
        // SI EL ID NO COINCIDE, LO ARREGLAMOS
        if (adminLocal.id !== supabaseId) {
            console.log(`⚠️ Detectado ID desincronizado. Local: ${adminLocal.id} vs Supabase: ${supabaseId}`);
            
            // Borramos el local viejo (para evitar conflicto de PK)
            await this.usersRepository.delete(adminLocal.id);
            
            // Lo recreamos con el ID correcto
            const nuevoAdmin = this.usersRepository.create({
                ...adminLocal,
                id: supabaseId, // <--- LA CLAVE DEL ÉXITO
                email: emailAdmin,
                contrasena: undefined // Limpiamos pass local
            });
            await this.usersRepository.save(nuevoAdmin);
            return { message: "✅ Admin SINCRONIZADO. IDs corregidos." };
        }
    } else {
        // Si no existe local, lo creamos con el ID de Supabase
        const nuevoAdmin = this.usersRepository.create({
            id: supabaseId, // <--- LA CLAVE DEL ÉXITO
            nombre: "Super Admin",
            username: "admin",
            telefono: "00000000",
            email: emailAdmin,
            rol: UserRole.PROPIETARIO,
            estatus: UserStatus.ACTIVO
        });
        await this.usersRepository.save(nuevoAdmin);
    }

    return { message: "✅ Sistema Sincronizado: admin / 123456" };
  }
}