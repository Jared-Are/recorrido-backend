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

  // --- LOOKUP (Paso 1 del Login) ---
  // Verifica si el usuario existe antes de pedir contraseña
  async lookupUser(identifier: string) {
    const user = await this.usersRepository.findOne({
        where: [
            { username: identifier },
            { telefono: identifier }
        ]
    });

    if (!user) throw new NotFoundException("Usuario no encontrado");
    
    // Solo devolvemos lo necesario para que el frontend sepa qué rol tiene
    return { 
        email: user.email, 
        rol: user.rol 
    };
  }

  // --- CREAR USUARIO ---
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
      } catch (e) { 
          // Log seguro (sin mostrar datos sensibles)
          console.error("Supabase create warning:", e.message); 
      }

      const nuevoUsuario = this.usersRepository.create({
        ...datos,
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

  // --- GENERAR INVITACIÓN ---
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

  // --- ACTIVAR CUENTA ---
  async activarCuenta(token: string, contrasena: string) {
    const user = await this.usersRepository.findOneBy({ invitationToken: token });
    if (!user) throw new NotFoundException("Link inválido.");

    try {
        await this.supabaseService.admin.updateUserById(user.id, { password: contrasena });
    } catch(e) { console.error("Error al sincronizar password con Supabase"); }

    user.estatus = UserStatus.ACTIVO;
    user.invitationToken = null as any;

    return await this.usersRepository.save(user);
  }

  // --- LOGIN (VERSIÓN BLINDADA 🛡️) ---
  async login(username: string, contrasena: string) {
    // 1. Validación básica
    if (!username) throw new BadRequestException("Username es obligatorio");

    // 2. Buscar usuario (SIN LOGS DE SQL)
    const query = this.usersRepository.createQueryBuilder("user")
      .where("user.username = :username", { username })
      .addSelect("user.contrasena");

    const user = await query.getOne();

    // 3. Validaciones de estado
    if (!user) throw new UnauthorizedException("Usuario no encontrado.");
    if (user.estatus !== UserStatus.ACTIVO) throw new UnauthorizedException("Cuenta no activada.");

    // 4. Login contra Supabase
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: user.email, 
        password: contrasena
    });

    if (error) {
        // Log genérico para debugging interno, pero SIN mostrar la contraseña
        console.error(`Login fallido para usuario: ${username}. Razón: ${error.message}`);
        throw new UnauthorizedException("Contraseña incorrecta.");
    }

    // 5. Limpieza de datos antes de responder
    const { contrasena: pass, invitationToken, ...result } = user;

    return { 
        ...result, 
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token 
    };
  }

  // --- ADMIN SEED (SOLO INTERNO - YA NO SE EXPONE) ---
  async createAdminSeed() {
    const emailAdmin = "admin@recorrido.app";
    const passAdmin = "123456";
    let supabaseId: string | null = null;

    try {
        const { data, error } = await this.supabaseService.admin.createUser({
            email: emailAdmin,
            password: passAdmin,
            email_confirm: true,
            user_metadata: { rol: 'propietario' }
        });

        if (data.user) {
            supabaseId = data.user.id;
        } else if (error) {
             const { data: loginData } = await this.supabaseService.client.auth.signInWithPassword({
                email: emailAdmin,
                password: passAdmin
            });
            if (loginData.user) supabaseId = loginData.user.id;
        }
    } catch (e) { console.error("Error interno en seed:", e.message); }

    if (!supabaseId) return { message: "❌ Error: No conectó con Supabase." };

    let adminLocal = await this.usersRepository.findOneBy({ username: 'admin' });
    
    if (!adminLocal) {
        adminLocal = await this.usersRepository.findOne({ where: { rol: 'propietario' } });
    }
    
    if (adminLocal) {
        if (adminLocal.id !== supabaseId) {
            await this.usersRepository.delete(adminLocal.id);
            
            const nuevoAdmin = this.usersRepository.create({
                ...adminLocal, 
                id: supabaseId,
                username: 'admin',
                email: emailAdmin,
                contrasena: undefined,
                estatus: UserStatus.ACTIVO
            });
            await this.usersRepository.save(nuevoAdmin);
            return { message: "✅ Admin REPARADO y SINCRONIZADO." };
        } else {
            adminLocal.username = 'admin';
            adminLocal.email = emailAdmin;
            adminLocal.estatus = UserStatus.ACTIVO;
            await this.usersRepository.save(adminLocal);
            return { message: "✅ Admin actualizado correctamente." };
        }
    } else {
        const nuevoAdmin = this.usersRepository.create({
            id: supabaseId,
            nombre: "Super Admin",
            username: "admin",
            telefono: "00000000",
            email: emailAdmin,
            rol: 'propietario',
            estatus: UserStatus.ACTIVO
        });
        await this.usersRepository.save(nuevoAdmin);
        return { message: "✅ Admin CREADO: admin / 123456" };
    }
  }
}