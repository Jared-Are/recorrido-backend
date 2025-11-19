import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find({ order: { nombre: 'ASC' } });
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  // --- 3. CREAR USUARIO (Normal) ---
  async create(datos: Partial<User>) {
    try {
      const telefonoLimpio = datos.telefono && datos.telefono.trim() !== '' ? datos.telefono : undefined;
      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) throw new BadRequestException(`Ya existe un usuario con el teléfono ${telefonoLimpio}`);

      let usernameFinal = datos.username;
      if (!usernameFinal && datos.nombre) {
        const base = datos.nombre.trim().toLowerCase().replace(/\s+/g, '.');
        const random = Math.floor(1000 + Math.random() * 9000);
        usernameFinal = `${base}${random}`;
      }

      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        username: usernameFinal,
        telefono: telefonoLimpio,
        email: datos.email || undefined,
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

  // --- 4. GENERAR INVITACIÓN ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.invitationToken = token;
    
    if (!user.username) {
       const base = user.nombre.trim().toLowerCase().replace(/\s+/g, '.');
       user.username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await this.usersRepository.save(user);

    const dominioFrontend = process.env.FRONTEND_URL || 'http://localhost:3000'; 
    const linkActivacion = `${dominioFrontend}/activar?token=${token}`;
    const mensaje = `Hola ${user.nombre}, bienvenido al Recorrido Escolar.\n\n👤 Tu Usuario: *${user.username}*\n🔐 Activa tu cuenta: ${linkActivacion}`;

    return { link: linkActivacion, telefono: user.telefono, mensaje: mensaje };
  }

  // --- 5. ACTIVAR CUENTA ---
  async activarCuenta(token: string, contrasena: string) {
    const user = await this.usersRepository.findOneBy({ invitationToken: token });
    if (!user) throw new NotFoundException("Token inválido o expirado.");

    user.contrasena = contrasena;
    user.estatus = UserStatus.ACTIVO;
    user.invitationToken = null as any; 

    return await this.usersRepository.save(user);
  }

  // --- 6. LOGIN ---
  async login(username: string, contrasena: string) {
    console.log(`🔍 Login -> User: "${username}"`);
    const user = await this.usersRepository.createQueryBuilder("user")
      .where("user.username = :username", { username })
      .addSelect("user.contrasena")
      .getOne();

    if (!user) throw new UnauthorizedException("Usuario no encontrado.");
    if (!user.contrasena || user.contrasena !== contrasena) throw new UnauthorizedException("Contraseña incorrecta.");
    if (user.estatus !== UserStatus.ACTIVO) throw new UnauthorizedException("Tu cuenta no está activa.");

    const { contrasena: pass, invitationToken, ...result } = user;
    return result;
  }

  // --- 🚀 RESCATE: CREAR ADMIN DE EMERGENCIA ---
  async createAdminSeed() {
    // 1. Revisar si ya existe para no duplicar
    const existe = await this.usersRepository.findOneBy({ username: 'admin' });
    if (existe) return { message: "El usuario 'admin' ya existe. Intenta loguearte con pass: 123456" };

    // 2. Crear al Super Admin
    const admin = this.usersRepository.create({
        nombre: "Super Admin",
        username: "admin",          // TU USUARIO
        contrasena: "123456",       // TU CONTRASEÑA
        telefono: "00000000",       // Dummy
        rol: UserRole.PROPIETARIO,  // Rol máximo
        estatus: UserStatus.ACTIVO  // ¡Activo de una vez!
    });

    await this.usersRepository.save(admin);
    return { message: "✅ Usuario Creado: admin / 123456" };
  }
}