import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { User, UserRole, UserStatus } from '../users/user.entity'; // Importa los Enums
import { Alumno } from '../alumnos/alumno.entity';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud) private solicitudRepo: Repository<Solicitud>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Alumno) private alumnoRepo: Repository<Alumno>,
  ) {}

  // 1. Crear una solicitud
  async create(datos: Partial<Solicitud>) {
    const nueva = this.solicitudRepo.create(datos);
    return this.solicitudRepo.save(nueva);
  }

  // 2. Listar todas
  findAll() {
    return this.solicitudRepo.find({ order: { fechaSolicitud: 'DESC' } });
  }

  // 3. Rechazar (Eliminar)
  async remove(id: string) {
    await this.solicitudRepo.delete(id);
    return { message: 'Solicitud rechazada/eliminada' };
  }

  // 4. APROBAR (Lógica corregida)
  async aprobar(id: string) {
    const solicitud = await this.solicitudRepo.findOneBy({ id });
    if (!solicitud) throw new NotFoundException("Solicitud no encontrada");

    // --- A. GESTIÓN DEL USUARIO (PADRE) ---
    
    // 1. Buscamos si el tutor ya existe por su TELÉFONO (tu identificador principal)
    // Nota: Asumo que tu entidad Solicitud tiene un campo 'telefono' o 'telefonoContacto'
    let tutorUser = await this.userRepo.findOne({ 
      where: { telefono: solicitud.telefono } 
    });

    // 2. Si NO existe, lo creamos desde cero
    if (!tutorUser) {
      tutorUser = this.userRepo.create({
        nombre: solicitud.padreNombre,
        telefono: solicitud.telefono, // Importante: pasar el teléfono
        email: solicitud.email || null, // Email opcional
        contrasena: undefined, // ¡SIN CONTRASEÑA! Se creará vía invitación
        rol: UserRole.TUTOR,       // Usamos el Enum
        estatus: UserStatus.INVITADO // Estado inicial
      });
      
      // Guardamos al nuevo tutor
      await this.userRepo.save(tutorUser);
    } 
    // Si YA existe (else), simplemente usamos la variable 'tutorUser' que ya encontramos
    // para asignarle el nuevo hijo. ¡No lanzamos error!

    // --- B. GESTIÓN DEL ALUMNO (HIJO) ---
    const nuevoAlumno = this.alumnoRepo.create({
        nombre: solicitud.hijoNombre,
        tutor: solicitud.padreNombre, // Texto plano (legacy)
        tutorUser: tutorUser,         // Relación real con el usuario
        direccion: solicitud.direccion,
        grado: "Sin asignar",
        precio: 0,
        activo: true,
        // Si tienes vehiculoId en la solicitud, agrégalo aquí
    });
    
    await this.alumnoRepo.save(nuevoAlumno);

    // --- C. LIMPIEZA ---
    // Borramos la solicitud porque ya fue procesada
    await this.solicitudRepo.remove(solicitud);

    return { 
      message: "Solicitud Aprobada correctamente", 
      tutor: tutorUser, 
      alumno: nuevoAlumno,
      // Tip: Aquí podrías retornar el 'invitationToken' si quisieras 
      // mandar el WhatsApp inmediatamente en la respuesta del front.
    };
  }
}