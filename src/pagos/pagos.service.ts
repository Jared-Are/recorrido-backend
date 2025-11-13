// src/pagos/pagos.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { CreatePagoBatchDto } from './dto/create-pago-batch.dto'; // <-- 1. IMPORTAR

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
  ) {}

  // --- CREAR (UN PAGO) ---
  create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const newPago = this.pagosRepository.create(createPagoDto);
    return this.pagosRepository.save(newPago);
  }

  // --- NUEVO MÉTODO PARA PAGO EN LOTE (PUNTO 3) ---
  async createBatch(createPagoBatchDto: CreatePagoBatchDto): Promise<Pago[]> {
    const { alumnoId, alumnoNombre, montoPorMes, meses, fecha } = createPagoBatchDto;

    // 1. Creamos un array de objetos de pago, uno por cada mes
    const pagosAGuardar: Partial<Pago>[] = meses.map(mes => ({
      alumnoId: alumnoId,
      alumnoNombre: alumnoNombre,
      monto: montoPorMes,
      mes: mes,
      fecha: fecha,
      estado: 'pagado',
    }));

    // 2. Creamos las entidades
    const nuevosPagos = this.pagosRepository.create(pagosAGuardar);

    // 3. Guardamos todas las entidades en la BD.
    // TypeORM es lo suficientemente inteligente para envolver esto
    // en una transacción si es necesario.
    return this.pagosRepository.save(nuevosPagos);
  }
  // --- FIN DEL NUEVO MÉTODO ---


  // --- LEER TODOS ---
  findAll(): Promise<Pago[]> {
    return this.pagosRepository.find();
  }

  // --- LEER UNO ---
  async findOne(id: string): Promise<Pago> {
    const pago = await this.pagosRepository.findOneBy({ id });
    if (!pago) {
      throw new NotFoundException(`Pago con id ${id} no encontrado`);
    }
    return pago;
  }

  // --- ACTUALIZAR ---
  async update(id: string, updatePagoDto: UpdatePagoDto): Promise<Pago> {
    const pago = await this.pagosRepository.preload({
      id: id,
      ...updatePagoDto,
    });
    if (!pago) {
      throw new NotFoundException(`Pago con id ${id} no encontrado`);
    }
    return this.pagosRepository.save(pago);
  }

  // --- ELIMINAR (Borrado Físico) ---
  async remove(id: string): Promise<void> {
    const pago = await this.findOne(id); // Revisa si existe
    await this.pagosRepository.remove(pago);
  }
}