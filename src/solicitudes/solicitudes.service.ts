import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { User, UserRole, UserStatus } from '../users/user.entity'; 
import { Alumno } from '../alumnos/alumno.entity';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud) private solicitudRepo: Repository<Solicitud>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Alumno) private alumnoRepo: Repository<Alumno>,
  ) {}

  // 1. Crear solicitud
  async create(datos: Partial<Solicitud>) {
    const nueva = this.solicitudRepo.create(datos);
    return this.solicitudRepo.save(nueva);
  }

  // 2. Listar todas
  findAll() {
    return this.solicitudRepo.find({ order: { fechaSolicitud: 'DESC' } });
  }

  // 3. Rechazar
  async remove(id: string) {
    await this.solicitudRepo.delete(id);
    return { message: 'Solicitud rechazada/eliminada' };
  }

  // 4. APROBAR (ACTUALIZADO CON USERNAME)
  async aprobar(id: string) {
    const solicitud = await this.solicitudRepo.findOneBy({ id });
    if (!solicitud) throw new NotFoundException("Solicitud no encontrada");

    // A. Buscar si el tutor ya existe por teléfono
    let tutorUser = await this.userRepo.findOne({ 
      where: { telefono: solicitud.telefono } 
    });

    // B. Si no existe, lo creamos CON USERNAME
    if (!tutorUser) {
      
      // Generar username automático (ej: juan.perez8821)
      const base = solicitud.padreNombre.trim().toLowerCase().replace(/\s+/g, '.');
      const random = Math.floor(1000 + Math.random() * 9000);
      const usernameGen = `${base}${random}`;

      tutorUser = this.userRepo.create({
        nombre: solicitud.padreNombre,
        telefono: solicitud.telefono,
        email: solicitud.email || undefined,
        username: usernameGen, // <--- AQUÍ LO GUARDAMOS
        contrasena: undefined, 
        rol: UserRole.TUTOR,     
        estatus: UserStatus.INVITADO 
      });
      
      tutorUser = await this.userRepo.save(tutorUser);
    } 

    // C. Crear Alumno asociado
    const newAlumno = this.alumnoRepo.create({
        nombre: solicitud.hijoNombre,
        tutor: solicitud.padreNombre, 
        tutorUser: tutorUser, 
        direccion: solicitud.direccion,
        grado: "Sin asignar",
        precio: 0,
        activo: true,
    });
    
    await this.alumnoRepo.save(newAlumno);

    // D. Borrar solicitud
    await this.solicitudRepo.remove(solicitud);

    return { 
      message: "Solicitud Aprobada", 
      tutor: tutorUser, 
      alumno: newAlumno 
    };
  }
}