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

  // --- 1. LISTAR TODOS ---
  findAll() {
    return this.usersRepository.find({
      order: { nombre: 'ASC' }
    });
  }

  // --- 2. BUSCAR UNO ---
  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  // --- 3. CREAR USUARIO ---
  async create(datos: Partial<User>) {
    try {
      const telefonoLimpio = datos.telefono && datos.telefono.trim() !== '' ? datos.telefono : undefined;
      const emailLimpio = datos.email && datos.email.trim() !== '' ? datos.email : undefined;

      if (!telefonoLimpio) throw new BadRequestException("El teléfono es obligatorio.");

      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) throw new BadRequestException(`Ya existe un usuario con el teléfono ${telefonoLimpio}`);

      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        nombre: datos.nombre,
        telefono: telefonoLimpio,
        email: emailLimpio,
        rol: datos.rol || UserRole.TUTOR,
        estatus: UserStatus.INVITADO, 
        contrasena: undefined, 
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error en create user:", error); 
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("No se pudo crear el usuario.");
    }
  }

  // --- 4. GENERAR INVITACIÓN ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.invitationToken = token;
    await this.usersRepository.save(user);

    const dominioFrontend = process.env.FRONTEND_URL || 'http://localhost:3000'; 
    const linkActivacion = `${dominioFrontend}/activar?token=${token}`;

    return { 
      link: linkActivacion,
      telefono: user.telefono,
      mensaje: `Hola ${user.nombre}, activa tu cuenta aquí: ${linkActivacion}`
    };
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

  // --- 6. LOGIN CON DEBUG ---
  async login(telefono: string, contrasena: string) {
    console.log(`🔍 Intento de Login -> Teléfono: "${telefono}" | Pass: "${contrasena}"`);

    // 1. Buscamos por teléfono
    const user = await this.usersRepository.findOne({ 
      where: { telefono } 
    });

    if (!user) {
      console.log("❌ Error Login: Usuario no encontrado en DB.");
      throw new UnauthorizedException("Credenciales incorrectas (Usuario no existe)");
    }

    console.log(`✅ Usuario encontrado: ${user.nombre} | Estatus: ${user.estatus} | PassDB: "${user.contrasena}"`);

    // 2. Validamos contraseña
    // OJO: Si user.contrasena es null/undefined, esto fallará siempre
    if (!user.contrasena || user.contrasena !== contrasena) {
      console.log("❌ Error Login: Contraseña no coincide o está vacía.");
      throw new UnauthorizedException("Credenciales incorrectas (Contraseña errónea)");
    }

    // 3. Validamos estatus
    if (user.estatus !== UserStatus.ACTIVO) {
      console.log("❌ Error Login: Usuario no está ACTIVO.");
      throw new UnauthorizedException("Tu cuenta no ha sido activada. Usa el link de WhatsApp.");
    }

    // 4. Éxito
    console.log("🎉 Login Exitoso");
    const { contrasena: pass, invitationToken, ...result } = user;
    return result;
  }
}