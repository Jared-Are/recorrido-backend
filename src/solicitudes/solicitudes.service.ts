import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud) private solicitudRepo: Repository<Solicitud>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Alumno) private alumnoRepo: Repository<Alumno>,
  ) {}

  // 1. Crear una solicitud (pública o desde admin)
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

  // 4. APROBAR (La lógica compleja)
  async aprobar(id: string) {
    const solicitud = await this.solicitudRepo.findOneBy({ id });
    if (!solicitud) throw new NotFoundException("Solicitud no encontrada");

    // A. Crear el Usuario (Tutor)
    // Generamos un email temporal si no tiene (padre_ID@sistema.com)
    const email = solicitud.email || `${solicitud.padreNombre.replace(/\s+/g, '.').toLowerCase()}_${id.slice(0,4)}@recorrido.com`;
    
    // Verificamos si ya existe el email
    const existeUser = await this.userRepo.findOneBy({ email });
    if (existeUser) throw new ConflictException("Ya existe un usuario con este email");

    const nuevoTutor = this.userRepo.create({
        nombre: solicitud.padreNombre,
        email: email,
        contrasena: "123456", // Contraseña por defecto
        rol: "tutor"
    });
    const tutorGuardado = await this.userRepo.save(nuevoTutor);

    // B. Crear el Alumno (Hijo)
    const nuevoAlumno = this.alumnoRepo.create({
        nombre: solicitud.hijoNombre,
        tutor: solicitud.padreNombre, // Campo string legacy
        tutorUser: tutorGuardado,     // Relación real
        direccion: solicitud.direccion,
        grado: "Sin asignar",
        precio: 0,
        activo: true
    });
    await this.alumnoRepo.save(nuevoAlumno);

    // C. Borrar la solicitud (ya se procesó)
    await this.solicitudRepo.remove(solicitud);

    return { message: "Aprobado", tutor: tutorGuardado, alumno: nuevoAlumno };
  }
}