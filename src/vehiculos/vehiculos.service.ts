import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private vehiculosRepository: Repository<Vehiculo>,
  ) {}

  // --- CREAR ---
  create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const newVehiculo = this.vehiculosRepository.create({
      ...createVehiculoDto,
      estado: 'activo', // Los vehículos nuevos siempre inician como 'activos'
    });
    return this.vehiculosRepository.save(newVehiculo);
  }

  // --- LEER TODOS (Excepto 'eliminados') ---
  findAll(): Promise<Vehiculo[]> {
    return this.vehiculosRepository.find({
      where: {
        estado: Not('eliminado') // Excluye los eliminados
      },
      order: {
        nombre: 'ASC' // Ordenar por nombre
      }
    });
  }

  // --- LEER TODOS POR ESTADO ---
  findAllByEstado(estado: string): Promise<Vehiculo[]> {
     return this.vehiculosRepository.find({
      where: {
        estado: estado
      },
      order: {
        nombre: 'ASC'
      }
    });
  }

  // --- LEER UNO ---
  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculosRepository.findOneBy({ id });
    if (!vehiculo || vehiculo.estado === 'eliminado') {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    return vehiculo;
  }

  // --- ACTUALIZAR (o cambiar estado) ---
  async update(id: string, updateVehiculoDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.vehiculosRepository.preload({
      id: id,
      ...updateVehiculoDto,
    });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    return this.vehiculosRepository.save(vehiculo);
  }

  // --- ELIMINAR (Borrado Físico) ---
  async remove(id: string): Promise<void> {
    const vehiculo = await this.findOne(id); // Revisa si existe
    await this.vehiculosRepository.remove(vehiculo);
  }
}