import { Injectable, NotFoundException } from '@nestjs/common'; // <-- 1. Importa NotFoundException
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

  findAll(): Promise<Alumno[]> {
    return this.alumnosRepository.find();
  }

  async create(createAlumnoDto: CreateAlumnoDto): Promise<Alumno> {
    const nuevoAlumno = this.alumnosRepository.create(createAlumnoDto);
    return this.alumnosRepository.save(nuevoAlumno);
  }

  // --- 2. AÑADE ESTE NUEVO MÉTODO ---
  async findOne(id: string): Promise<Alumno> {
    // Busca al alumno por su ID
    const alumno = await this.alumnosRepository.findOneBy({ id });

    // Si no lo encuentra, lanza un error 404
    if (!alumno) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }

    // Si lo encuentra, lo devuelve
    return alumno;
  }

  // --- AÑADE ESTE NUEVO MÉTODO ---
  async update(id: string, updateAlumnoDto: UpdateAlumnoDto): Promise<Alumno> {
    
    // 1. Cargamos el alumno existente
    //    'preload' busca por ID y luego fusiona los datos del DTO.
    //    Si no lo encuentra, devuelve 'undefined'.
    const alumnoExistente = await this.alumnosRepository.preload({
      id: id,
      ...updateAlumnoDto, // Fusiona los nuevos datos
    });

    // 2. Si no existe, lanzamos un error 404
    if (!alumnoExistente) {
      throw new NotFoundException(`Alumno con id ${id} no encontrado`);
    }

    // 3. Si existe, guardamos los cambios en la BD
    return this.alumnosRepository.save(alumnoExistente);
  }

  // --- AÑADE ESTE NUEVO MÉTODO ---
  async remove(id: string): Promise<void> {
    
    // 1. Primero, comprobamos que el alumno existe (y no está ya borrado)
    //    Nuestro método findOne(id) ya hace esto, ¡así que lo reutilizamos!
    const alumno = await this.findOne(id); 

    // 2. Si findOne no lanzó un error 404, usamos softDelete
    //    Esto no borra el registro, solo pone la fecha actual en la columna 'deletedAt'
    await this.alumnosRepository.softDelete(id);
  }
}