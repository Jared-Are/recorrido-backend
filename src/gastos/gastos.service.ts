import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Gasto } from './gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { Personal } from '../personal/personal.entity'; // <-- 1. IMPORTAR PERSONAL

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private gastosRepository: Repository<Gasto>,
    
    // --- 2. INYECTAR REPOSITORIO DE PERSONAL ---
    @InjectRepository(Personal)
    private personalRepository: Repository<Personal>,
  ) {}

  // --- CREAR (CON LÓGICA DE SALARIOS) ---
  async create(createGastoDto: CreateGastoDto): Promise<Gasto> {
    const { categoria, personalId, monto, descripcion } = createGastoDto;

    let montoFinal: number;
    let descripcionFinal = descripcion;

    if (categoria === 'salarios' && personalId) {
      // --- LÓGICA AUTOMÁTICA DE SALARIOS ---
      const empleado = await this.personalRepository.findOneBy({ id: personalId });
      
      if (!empleado) {
        throw new NotFoundException(`No se encontró el empleado con ID ${personalId}`);
      }
      if (!empleado.salario || empleado.salario <= 0) {
        throw new BadRequestException(`El empleado ${empleado.nombre} no tiene un salario asignado.`);
      }

      montoFinal = empleado.salario;
      
      // Si la descripción está vacía, la auto-completamos
      if (!descripcionFinal || descripcionFinal.trim() === "") {
        descripcionFinal = `Pago de salario: ${empleado.nombre}`;
      }

    } else if (!monto || monto <= 0) {
      // --- LÓGICA MANUAL (COMBUSTIBLE, OTROS, O SALARIO MANUAL) ---
      throw new BadRequestException(`El monto es obligatorio y debe ser mayor a cero para esta categoría.`);
    
    } else {
      montoFinal = monto;
    }

    // Creamos el gasto con los datos validados
    const newGasto = this.gastosRepository.create({
      ...createGastoDto,
      descripcion: descripcionFinal,
      monto: montoFinal,
      estado: 'activo',
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

    // Lógica para recalcular salario si se edita
    if (updateGastoDto.categoria === 'salarios' && updateGastoDto.personalId) {
       const empleado = await this.personalRepository.findOneBy({ id: updateGastoDto.personalId });
       if (!empleado) throw new NotFoundException(`Empleado con id ${updateGastoDto.personalId} no encontrado.`);
       if (!empleado.salario || empleado.salario <= 0) {
         throw new BadRequestException(`El empleado ${empleado.nombre} no tiene un salario asignado.`);
       }
       gasto.monto = empleado.salario;
       gasto.descripcion = `Pago de salario: ${empleado.nombre}`;
    } else if (updateGastoDto.monto) {
      gasto.monto = updateGastoDto.monto;
    }
    
    return this.gastosRepository.save(gasto);
  }

  // --- ELIMINAR (Borrado Físico) ---
  async remove(id: string): Promise<void> {
    const gasto = await this.findOne(id); // Revisa si existe
    await this.gastosRepository.remove(gasto);
  }
}