import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from './alumno.entity';
import { User, UserStatus, UserRole } from '../users/user.entity'; 
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno)
    private alumnosRepository: Repository<Alumno>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // --- CREAR (Con lógica de Tutor automático) ---
  async create(createAlumnoDto: CreateAlumnoDto): Promise<Alumno> {
    const { tutor: datosTutor, ...datosAlumno } = createAlumnoDto;

    // 1. Buscar si el tutor ya existe por teléfono
    let usuarioTutor = await this.usersRepository.findOne({ 
      where: { telefono: datosTutor.telefono } 
    });

    // 2. Si no existe, crearlo como INVITADO
    if (!usuarioTutor) {
      usuarioTutor = this.usersRepository.create({
        nombre: datosTutor.nombre,
        telefono: datosTutor.telefono,
        rol: UserRole.TUTOR,
        estatus: UserStatus.INVITADO,
        contrasena: undefined, // Sin contraseña al inicio
      });
      await this.usersRepository.save(usuarioTutor);
    }

    // 3. Crear el alumno asociado
    const newAlumno = this.alumnosRepository.create({
      ...datosAlumno,
      tutor: datosTutor.nombre, // Guardamos el string por compatibilidad
      tutorUser: usuarioTutor,  // Guardamos la relación real
      activo: true,
    });

    return this.alumnosRepository.save(newAlumno);
  }

  // --- LEER TODOS ---
  findAll(): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
      relations: ['vehiculo', 'tutorUser'], 
    });
  }

  // --- LEER TODOS POR ESTADO (¡ESTA ES LA QUE FALTABA!) ---
  findAllByEstado(activo: boolean): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: { activo: activo },
      order: { nombre: 'ASC' },
      relations: ['vehiculo', 'tutorUser'],
    });
  }

  // --- LEER UNO ---
  async findOne(id: string): Promise<Alumno> {
    const alumno = await this.alumnosRepository.findOne({
        where: { id },
        relations: ['vehiculo', 'tutorUser']
    });
    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }
    return alumno;
  }

  // --- ACTUALIZAR ---
  async update(id: string, updateAlumnoDto: UpdateAlumnoDto): Promise<Alumno> {
    // Sacamos 'tutor' del DTO para que preload no falle
    const { tutor, ...datosSimples } = updateAlumnoDto;

    const alumno = await this.alumnosRepository.preload({
      id: id,
      ...datosSimples,
    });

    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }

    // Si mandaron datos del tutor, actualizamos el campo de texto (opcional)
    if (tutor) {
        alumno.tutor = tutor.nombre;
    }

    return this.alumnosRepository.save(alumno);
  }

  // --- ELIMINAR ---
  async remove(id: string): Promise<void> {
    const alumno = await this.findOne(id);
    await this.alumnosRepository.remove(alumno);
  }
}