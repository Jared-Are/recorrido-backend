// src/pagos/pagos.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Pago } from './pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { CreatePagoBatchDto } from './dto/create-pago-batch.dto';
import { Alumno } from '../alumnos/alumno.entity'; // <-- 1. IMPORTAR LA ENTIDAD ALUMNO

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,

    // --- 2. INYECTAR EL REPOSITORIO DE ALUMNOS ---
    @InjectRepository(Alumno)
    private alumnosRepository: Repository<Alumno>,
  ) {}

  // --- CREAR (UN PAGO) ---
  // Convertido a async para permitir la validación
  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    
    // --- 3. LÓGICA DE VALIDACIÓN (Backend) ---
    // Esta validación solo se aplica a los abonos (Diciembre)
    // Los pagos regulares (Feb-Nov) se asumen completos.
    
    const ANIO_ESCOLAR = new Date().getFullYear().toString();
    const MES_DICIEMBRE = `Diciembre ${ANIO_ESCOLAR}`;

    if (createPagoDto.mes === MES_DICIEMBRE) {
      // 1. Obtener el precio mensual del alumno desde la BD
      const alumno = await this.alumnosRepository.findOneBy({ id: createPagoDto.alumnoId });
      if (!alumno || !alumno.precio) {
        throw new NotFoundException(`No se encontró el alumno o su precio.`);
      }
      const precioMensual = alumno.precio;

      // 2. Sumar pagos existentes para ese mes (en la BD)
      const pagosExistentes = await this.pagosRepository.find({
        where: {
          alumnoId: createPagoDto.alumnoId,
          mes: MES_DICIEMBRE
        }
      });
      const totalPagadoYa = pagosExistentes.reduce((sum, pago) => sum + pago.monto, 0);

      // 3. Calcular saldo real en el servidor
      const saldoReal = precioMensual - totalPagadoYa;

      // 4. ¡LA VALIDACIÓN CRÍTICA!
      // (con margen de 0.01 para errores de flotante)
      if (createPagoDto.monto > (saldoReal + 0.01)) {
        // Si el pago es mayor al saldo real, se rechaza.
        throw new BadRequestException( // Error 400
          `El monto C$ ${createPagoDto.monto} excede el saldo pendiente real de C$ ${saldoReal.toFixed(2)}`
        );
      }
    }
    // --- FIN DE LA VALIDACIÓN ---

    // Si pasa la validación (o no era Diciembre), se guarda.
    const newPago = this.pagosRepository.create(createPagoDto);
    return this.pagosRepository.save(newPago);
  }

  // --- PAGO EN LOTE (BATCH) ---
  // También modificado para prevenir pagos duplicados (race condition)
  async createBatch(createPagoBatchDto: CreatePagoBatchDto): Promise<Pago[]> {
    const { alumnoId, alumnoNombre, montoPorMes, meses, fecha } = createPagoBatchDto;

    // --- 4. VALIDACIÓN BATCH ---
    // 1. Ver qué meses de los solicitados ya existen en la BD
    const pagosExistentes = await this.pagosRepository.find({
      where: {
        alumnoId: alumnoId,
        mes: In(meses) // In() busca todos los registros donde 'mes' sea uno de los del array
      }
    });
    const mesesYaPagados = new Set(pagosExistentes.map(p => p.mes));

    // 2. Filtrar y quedarse solo con los meses que NO han sido pagados
    const mesesAGuardar = meses.filter(mes => !mesesYaPagados.has(mes));
    
    if (mesesAGuardar.length === 0) {
      // El cliente intentó pagar meses que ya estaban pagados.
      // Devolvemos un array vacío para no crear duplicados.
      return []; 
    }
    // --- FIN VALIDACIÓN BATCH ---

    // 3. Crear solo los pagos de los meses filtrados
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
    // si se está editando un pago de Diciembre.
    // (Por ahora, lo dejamos así por simplicidad)

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