import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from './alumno.entity';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno)
    private alumnosRepository: Repository<Alumno>,
  ) {}

  // --- CREAR ---
  async create(createAlumnoDto: CreateAlumnoDto): Promise<Alumno> {
    const newAlumno = this.alumnosRepository.create({
      ...createAlumnoDto,
      activo: true, // Por defecto al crear
    });
    return this.alumnosRepository.save(newAlumno);
  }

  // --- LEER TODOS (Activos por defecto) ---
  findAll(): Promise<Alumno[]> {
    return this.alumnosRepository.find({
      where: {
        activo: true // El GET /alumnos normal solo trae activos
      },
      order: {
        nombre: 'ASC'
      }
      // 'vehiculo' se carga automáticamente por el 'eager: true' en la entidad
    });
  }

  // --- ¡NUEVO MÉTODO AÑADIDO! ---
  // --- LEER TODOS POR ESTADO ---
  findAllByEstado(activo: boolean): Promise<Alumno[]> {
     return this.alumnosRepository.find({
      where: {
        activo: activo // Filtra por 'activo: true' o 'activo: false'
      },
      order: {
        nombre: 'ASC'
      }
    });
  }
  // --- FIN DEL NUEVO MÉTODO ---


  // --- LEER UNO ---
  async findOne(id: string): Promise<Alumno> {
    const alumno = await this.alumnosRepository.findOneBy({ id });
    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }
    return alumno;
  }

  // --- ACTUALIZAR (o cambiar estado) ---
  async update(id: string, updateAlumnoDto: UpdateAlumnoDto): Promise<Alumno> {
    const alumno = await this.alumnosRepository.preload({
      id: id,
      ...updateAlumnoDto,
    });
    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }
    return this.alumnosRepository.save(alumno);
  }

  // --- ELIMINAR (Borrado Físico) ---
  async remove(id: string): Promise<void> {
    const alumno = await this.findOne(id); // Revisa si existe
    await this.alumnosRepository.remove(alumno);
  }
}