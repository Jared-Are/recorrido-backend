import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Personal } from './personal.entity';
import { CreatePersonalDto } from './dto/create-personal.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';

@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(Personal)
    private personalRepository: Repository<Personal>,
  ) {}

  // --- CREAR ---
  create(createPersonalDto: CreatePersonalDto): Promise<Personal> {
    const newPersonal = this.personalRepository.create({
      ...createPersonalDto,
      estado: 'activo', // El personal nuevo siempre inicia como 'activo'
    });
    return this.personalRepository.save(newPersonal);
  }

  // --- LEER TODOS (Excepto 'eliminados') ---
  findAll(): Promise<Personal[]> {
    return this.personalRepository.find({
      where: {
        estado: Not('eliminado') // Excluye los eliminados
      },
      order: {
        nombre: 'ASC' // Ordenar por nombre
      }
    });
  }

  // --- LEER TODOS POR ESTADO (activo/inactivo) ---
  findAllByEstado(estado: string): Promise<Personal[]> {
     return this.personalRepository.find({
      where: {
        estado: estado
      },
      order: {
        nombre: 'ASC'
      }
    });
  }

  // --- LEER UNO ---
  async findOne(id: string): Promise<Personal> {
    const personal = await this.personalRepository.findOneBy({ id });
    if (!personal || personal.estado === 'eliminado') {
      throw new NotFoundException(`Personal con id ${id} no encontrado`);
    }
    return personal;
  }

  // --- ACTUALIZAR (o cambiar estado) ---
  async update(id: string, updatePersonalDto: UpdatePersonalDto): Promise<Personal> {
    const personal = await this.personalRepository.preload({
      id: id,
      ...updatePersonalDto,
    });
    if (!personal) {
      throw new NotFoundException(`Personal con id ${id} no encontrado`);
    }
    return this.personalRepository.save(personal);
  }

  // --- ELIMINAR (Borrado Físico) ---
  async remove(id: string): Promise<void> {
    const personal = await this.findOne(id); // Revisa si existe
    await this.personalRepository.remove(personal);
  }
}