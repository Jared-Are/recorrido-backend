import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Pago } from './pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { CreatePagoBatchDto } from './dto/create-pago-batch.dto';
import { Alumno } from '../alumnos/alumno.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,

    @InjectRepository(Alumno)
    private alumnosRepository: Repository<Alumno>,
  ) {}

  // --- CREAR (UN PAGO) ---
  // AHORA CON VALIDACIÓN COMPLETA PARA TODOS LOS MESES
  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    
    const { alumnoId, mes, monto } = createPagoDto;

    const ANIO_ESCOLAR = new Date().getFullYear().toString();
    const MES_DICIEMBRE = `Diciembre ${ANIO_ESCOLAR}`;

    // 1. Obtener el precio mensual del alumno desde la BD
    const alumno = await this.alumnosRepository.findOneBy({ id: alumnoId });
    if (!alumno || !alumno.precio) {
      throw new NotFoundException(`No se encontró el alumno o su precio.`);
    }
    const precioMensual = alumno.precio;

    // 2. Sumar pagos existentes para ese mes (en la BD)
    const pagosExistentes = await this.pagosRepository.find({
      where: {
        alumnoId: alumnoId,
        mes: mes
      }
    });

    // 3. Lógica de Validación (Híbrida)
    if (mes === MES_DICIEMBRE) {
      // --- LÓGICA DE ABONOS (Diciembre) ---
      const totalPagadoYa = pagosExistentes.reduce((sum, pago) => sum + pago.monto, 0);
      const saldoReal = precioMensual - totalPagadoYa;

      // (con margen de 0.01 para errores de flotante)
      if (monto > (saldoReal + 0.01)) {
        throw new BadRequestException( // Error 400
          `El monto C$ ${monto} excede el saldo pendiente real de C$ ${saldoReal.toFixed(2)}`
        );
      }
    } else {
      // --- LÓGICA DE PAGO ÚNICO (Feb-Nov) ---
      // Si ya existe CUALQUIER pago para este mes, lo rechazamos.
      if (pagosExistentes.length > 0) {
        throw new BadRequestException( // Error 400
          `Ya existe un pago registrado para ${mes}. No se permiten pagos duplicados.`
        );
      }
      
      // Opcional: Validar que el monto sea el completo
      if (Math.abs(monto - precioMensual) > 0.01) {
         throw new BadRequestException(
          `El monto C$ ${monto} no coincide con la mensualidad de C$ ${precioMensual.toFixed(2)} para este mes.`
        );
      }
    }
    // --- FIN DE LA VALIDACIÓN ---

    // 4. Si pasa la validación, se guarda.
    const newPago = this.pagosRepository.create(createPagoDto);
    return this.pagosRepository.save(newPago);
  }

  // --- PAGO EN LOTE (BATCH) ---
  // (Esta función ya tenía la validación correcta y no necesita cambios)
  async createBatch(createPagoBatchDto: CreatePagoBatchDto): Promise<Pago[]> {
    const { alumnoId, alumnoNombre, montoPorMes, meses, fecha } = createPagoBatchDto;

    const pagosExistentes = await this.pagosRepository.find({
      where: {
        alumnoId: alumnoId,
        mes: In(meses) 
      }
    });
    const mesesYaPagados = new Set(pagosExistentes.map(p => p.mes));

    const mesesAGuardar = meses.filter(mes => !mesesYaPagados.has(mes));
    
    if (mesesAGuardar.length === 0) {
      // El frontend intentó pagar meses que ya estaban en la BD.
      // Devolvemos un array vacío y no hacemos nada.
      return []; 
    }

    const pagosAGuardar: Partial<Pago>[] = mesesAGuardar.map(mes => ({
      alumnoId: alumnoId,
      alumnoNombre: alumnoNombre,
      monto: montoPorMes,
      mes: mes,
      fecha: fecha,
      estado: 'pagado',
    }));

    const nuevosPagos = this.pagosRepository.create(pagosAGuardar);
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
    // TODO: La actualización también debería validar el monto
    // si se está editando un pago. (Fase 2)

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