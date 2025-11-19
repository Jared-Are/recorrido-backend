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
      // A. SANITIZACIÓN DE DATOS
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
        estatus: UserStatus.INVITADO,
        contrasena: undefined,
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      console.error("Error en create user:", error); 
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("No se pudo crear el usuario. Revisa si el teléfono o email ya existen.");
    }
  }

  // --- 4. GENERAR INVITACIÓN DE WHATSAPP ---
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
      mensaje: `Hola ${user.nombre}, te damos la bienvenida al Recorrido Escolar. Para activar tu cuenta y crear tu contraseña, entra aquí: ${linkActivacion}`
    };
  }

  // --- 5. ACTIVAR CUENTA ---
  async activarCuenta(token: string, contrasena: string) {
    const user = await this.usersRepository.findOneBy({ invitationToken: token });

    if (!user) {
      throw new NotFoundException("Token inválido o expirado.");
    }

    // Actualizamos los datos
    user.contrasena = contrasena;
    user.estatus = UserStatus.ACTIVO;
    
    // Forzamos null con 'as any' para limpiar el token
    user.invitationToken = null as any; 

    return await this.usersRepository.save(user);
  }

  // --- 6. LOGIN (CON CORRECCIÓN DE PASSDB) ---
  async login(telefono: string, contrasena: string) {
    console.log(`🔍 Intento de Login -> Teléfono: "${telefono}"`);

    // CORRECCIÓN: Usamos createQueryBuilder para forzar la lectura de 'contrasena'
    // que tiene select: false por defecto en la entidad
    const user = await this.usersRepository.createQueryBuilder("user")
      .where("user.telefono = :telefono", { telefono })
      .addSelect("user.contrasena") // <--- ¡ESTA LÍNEA ES LA QUE FALTABA!
      .getOne();

    if (!user) {
      console.log("❌ Error Login: Usuario no encontrado en DB.");
      throw new UnauthorizedException("Credenciales incorrectas (Usuario no existe)");
    }

    console.log(`✅ Usuario encontrado: ${user.nombre} | PassDB: "${user.contrasena}"`);

    // Validamos contraseña
    if (!user.contrasena || user.contrasena !== contrasena) {
      console.log("❌ Error Login: Contraseña no coincide.");
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    // Validamos estatus
    if (user.estatus !== UserStatus.ACTIVO) {
      console.log("❌ Error Login: Usuario no está ACTIVO.");
      throw new UnauthorizedException("Tu cuenta no ha sido activada. Usa el link de WhatsApp.");
    }

    console.log("🎉 Login Exitoso");
    
    // Quitamos la contraseña antes de devolver el objeto
    const { contrasena: pass, invitationToken, ...result } = user;
    return result;
  }
  
}