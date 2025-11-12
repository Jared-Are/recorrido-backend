import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
  ) {}

  // --- CREAR ---
  create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const newPago = this.pagosRepository.create(createPagoDto);
    return this.pagosRepository.save(newPago);
  }

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