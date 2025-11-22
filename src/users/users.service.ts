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

      // CORRECCIÓN AQUÍ: Forzamos el tipo 'string' para evitar conflicto con UUID estricto
      let authUserId: string = crypto.randomUUID(); 
      
      try {
          const { data: authUser } = await this.supabaseService.admin.createUser({
            email: emailFantasma,
            password: passwordTemporal,
            email_confirm: true,
            user_metadata: { nombre: datos.nombre, rol: datos.rol }
          });
          
          // Ahora sí podemos asignar el string de supabase a nuestra variable string
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
      .addSelect("user.contrasena") // Aunque ya no la usamos para login principal, la traemos por si acaso
      .getOne();

    if (!user) throw new UnauthorizedException("Usuario no encontrado.");
    if (user.estatus !== UserStatus.ACTIVO) throw new UnauthorizedException("Cuenta no activada.");

    // Autenticar contra Supabase usando el email fantasma
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: user.email, 
        password: contrasena
    });

    if (error) throw new UnauthorizedException("Contraseña incorrecta.");

    // Devolvemos el usuario local + el token real de Supabase
    return { ...user, access_token: data.session.access_token };
  }

  // --- 🚨 RESCATE INTELIGENTE (FIX ADMIN) ---
  async createAdminSeed() {
    let admin = await this.usersRepository.findOneBy({ username: 'admin' });
    
    if (!admin) {
        admin = await this.usersRepository.findOne({ where: { rol: UserRole.PROPIETARIO } });
    }

    if (admin) {
        // REPARAR ADMIN EXISTENTE
        admin.username = 'admin';       
        admin.estatus = UserStatus.ACTIVO; 
        
        if (!admin.email || !admin.email.includes('@')) {
            admin.email = 'admin@recorrido.app';
        }

        try {
            await this.supabaseService.admin.updateUserById(admin.id, {
                email: admin.email,
                password: '123456',
                user_metadata: { rol: 'propietario' }
            });
        } catch (e) {
             try {
                const { data } = await this.supabaseService.admin.createUser({
                    email: admin.email,
                    password: '123456',
                    email_confirm: true,
                    user_metadata: { rol: 'propietario' }
                });
                if (data.user) admin.id = data.user.id;
             } catch (createErr) { console.log("Error recreando admin", createErr); }
        }

        await this.usersRepository.save(admin);
        return { message: "✅ Tu usuario Admin ha sido REPARADO. Usa: admin / 123456" };
    }

    // CREAR NUEVO ADMIN SI NO EXISTE NADA
    const nuevoId = crypto.randomUUID();
    const nuevoAdmin = this.usersRepository.create({
        id: nuevoId,
        nombre: "Super Admin",
        username: "admin",
        telefono: "00000000",
        email: "admin@recorrido.app",
        rol: UserRole.PROPIETARIO,
        estatus: UserStatus.ACTIVO
    });
    
    try {
        await this.supabaseService.admin.createUser({
            email: "admin@recorrido.app",
            password: "123456",
            email_confirm: true,
            user_metadata: { rol: 'propietario' }
        });
    } catch(e) {}

    await this.usersRepository.save(nuevoAdmin);
    return { message: "✅ Usuario Creado desde cero: admin / 123456" };
  }
}