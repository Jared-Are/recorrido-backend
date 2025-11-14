import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Gasto } from './gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private gastosRepository: Repository<Gasto>,
  ) {}

  // --- CREAR ---
  create(createGastoDto: CreateGastoDto): Promise<Gasto> {
    const newGasto = this.gastosRepository.create({
      ...createGastoDto,
      estado: 'activo', // Los gastos nuevos siempre inician como 'activos'
    });
    return this.gastosRepository.save(newGasto);
  }

  // --- LEER TODOS (Excepto 'eliminados') ---
  findAll(): Promise<Gasto[]> {
    return this.gastosRepository.find({
      where: {
        estado: Not('eliminado') // Excluye los eliminados
      },
      order: {
        fecha: 'DESC' // Ordenar por fecha, más nuevos primero
      }
    });
  }

  // --- LEER TODOS POR ESTADO (activo/inactivo) ---
  findAllByEstado(estado: string): Promise<Gasto[]> {
     return this.gastosRepository.find({
      where: {
        estado: estado
      },
      order: {
        fecha: 'DESC'
      }
    });
  }


  // --- LEER UNO ---
  async findOne(id: string): Promise<Gasto> {
    const gasto = await this.gastosRepository.findOneBy({ id });
    if (!gasto || gasto.estado === 'eliminado') {
      throw new NotFoundException(`Gasto con id ${id} no encontrado`);
    }
    return gasto;
  }

  // --- ACTUALIZAR (o cambiar estado) ---
  async update(id: string, updateGastoDto: UpdateGastoDto): Promise<Gasto> {
    const gasto = await this.gastosRepository.preload({
      id: id,
      ...updateGastoDto,
    });
    if (!gasto) {
      throw new NotFoundException(`Gasto con id ${id} no encontrado`);
    }
    return this.gastosRepository.save(gasto);
  }

  // --- ELIMINAR (Borrado Físico) ---
  async remove(id: string): Promise<void> {
    const gasto = await this.findOne(id); // Revisa si existe
    await this.gastosRepository.remove(gasto);
  }
}