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

  // --- 3. CREAR USUARIO (Manual o desde Solicitud) ---
  async create(datos: Partial<User>) {
    try {
      // A. SANITIZACIÓN: Convertimos "" a undefined para evitar errores de UNIQUE en la BD
      const telefonoLimpio = datos.telefono && datos.telefono.trim() !== '' ? datos.telefono : undefined;
      const emailLimpio = datos.email && datos.email.trim() !== '' ? datos.email : undefined;

      // B. VALIDACIONES
      if (!telefonoLimpio) {
        throw new BadRequestException("El teléfono es obligatorio.");
      }

      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) {
        throw new BadRequestException(`Ya existe un usuario con el teléfono ${telefonoLimpio}`);
      }

      // C. CREACIÓN
      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        nombre: datos.nombre,
        telefono: telefonoLimpio,
        email: emailLimpio,
        rol: datos.rol || UserRole.TUTOR,
        estatus: UserStatus.INVITADO, // Nace como invitado
        contrasena: undefined,        // Sin contraseña
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error en create user:", error); 
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("No se pudo crear el usuario. Revisa si el teléfono ya existe.");
    }
  }

  // --- 4. GENERAR INVITACIÓN WHATSAPP ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Token simple aleatorio
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    user.invitationToken = token;
    await this.usersRepository.save(user);

    // Ajusta la URL para producción o local
    const dominioFrontend = process.env.FRONTEND_URL || 'http://localhost:3000'; 
    const linkActivacion = `${dominioFrontend}/activar?token=${token}`;

    return { 
      link: linkActivacion,
      telefono: user.telefono,
      mensaje: `Hola ${user.nombre}, te damos la bienvenida al Recorrido Escolar. Para activar tu cuenta y crear tu contraseña, entra aquí: ${linkActivacion}`
    };
  }

  // --- 5. ACTIVAR CUENTA ---
  async activarCuenta(token: string, contrasena: string) {
    const user = await this.usersRepository.findOneBy({ invitationToken: token });

    if (!user) {
      throw new NotFoundException("Token inválido o expirado.");
    }

    // Guardamos contraseña y activamos
    user.contrasena = contrasena;
    user.estatus = UserStatus.ACTIVO;
    user.invitationToken = null as any; // Forzamos null para limpiar el token

    return await this.usersRepository.save(user);
  }

  // --- 6. LOGIN (Validar credenciales) ---
  async login(telefono: string, contrasena: string) {
    // 1. Buscamos por teléfono
    const user = await this.usersRepository.findOne({ 
      where: { telefono } 
    });

    // 2. Validamos existencia y contraseña
    if (!user || user.contrasena !== contrasena) {
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    // 3. Validamos que la cuenta esté activa
    if (user.estatus !== UserStatus.ACTIVO) {
      throw new UnauthorizedException("Tu cuenta no ha sido activada. Revisa tu invitación de WhatsApp.");
    }

    // 4. Retornamos usuario sin datos sensibles
    const { contrasena: pass, invitationToken, ...result } = user;
    return result;
  }
}