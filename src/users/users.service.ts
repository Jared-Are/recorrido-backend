import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      // Si vienen comillas vacías "", las convertimos a undefined para que no choquen con el UNIQUE de la BD
      const telefonoLimpio = datos.telefono && datos.telefono.trim() !== '' ? datos.telefono : undefined;
      const emailLimpio = datos.email && datos.email.trim() !== '' ? datos.email : undefined;

      // B. VALIDACIONES
      if (!telefonoLimpio) {
        throw new BadRequestException("El teléfono es obligatorio.");
      }

      // Verificamos si ya existe el teléfono
      const existe = await this.usersRepository.findOneBy({ telefono: telefonoLimpio });
      if (existe) {
        throw new BadRequestException(`Ya existe un usuario con el teléfono ${telefonoLimpio}`);
      }

      // C. CREACIÓN
      const nuevoUsuario = this.usersRepository.create({
        ...datos,
        nombre: datos.nombre,
        telefono: telefonoLimpio, // Usamos el dato limpio
        email: emailLimpio,       // Usamos el dato limpio
        rol: datos.rol || UserRole.TUTOR,
        estatus: UserStatus.INVITADO, // Siempre nace invitado
        contrasena: undefined,        // Sin contraseña
      });

      return await this.usersRepository.save(nuevoUsuario);

    } catch (error) {
      // Esto imprimirá el error real en los Logs de Render
      console.error("Error en create user:", error); 
      
      // Si el error ya es una excepción controlada (BadRequest), la relanzamos
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Si es otro error (ej. base de datos), lanzamos uno genérico
      throw new BadRequestException("No se pudo crear el usuario. Revisa si el teléfono o email ya existen.");
    }
  }

  // --- 4. GENERAR INVITACIÓN DE WHATSAPP ---
  async generarTokenInvitacion(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Generamos un token simple y único
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    user.invitationToken = token;
    await this.usersRepository.save(user);

    // Construimos el link (Ajusta esta URL a tu dominio real en producción)
    // Ejemplo local: http://localhost:3000/activar?token=...
    // Ejemplo prod: https://tu-app-recorrido.vercel.app/activar?token=...
    const dominioFrontend = process.env.FRONTEND_URL || 'http://localhost:3000'; 
    const linkActivacion = `${dominioFrontend}/activar?token=${token}`;

    return { 
      link: linkActivacion,
      telefono: user.telefono,
      mensaje: `Hola ${user.nombre}, te damos la bienvenida al Recorrido Escolar. Para activar tu cuenta y crear tu contraseña, entra aquí: ${linkActivacion}`
    };
  }
}