import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Pago } from './pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { CreatePagoBatchDto } from './dto/create-pago-batch.dto';
import { Alumno } from '../alumnos/alumno.entity';

// 👇 IMPORTACIONES NUEVAS (Para Notificaciones y Tiempo Real)
import { User } from '../users/user.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,

    @InjectRepository(Alumno)
    private alumnosRepository: Repository<Alumno>,

    // 👇 INYECCIONES NUEVAS
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificacionesService: NotificacionesService,
    private eventsGateway: EventsGateway,
  ) {}

  // --- CREAR (UN PAGO) ---
  // TU LÓGICA ORIGINAL + NOTIFICACIONES
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
      const totalPagadoYa = pagosExistentes.reduce((sum, pago) => sum + Number(pago.monto), 0);
      const saldoReal = precioMensual - totalPagadoYa;

      // (con margen de 0.01 para errores de flotante)
      if (Number(monto) > (saldoReal + 0.01)) {
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
      if (Math.abs(Number(monto) - Number(precioMensual)) > 0.01) {
         throw new BadRequestException(
          `El monto C$ ${monto} no coincide con la mensualidad de C$ ${precioMensual.toFixed(2)} para este mes.`
        );
      }
    }
    // --- FIN DE LA VALIDACIÓN ---

    // 4. Guardar Pago
    const newPago = this.pagosRepository.create(createPagoDto);
    const resultado = await this.pagosRepository.save(newPago);

    // 🔔 MAGIA 1: Notificar a los Propietarios
    this.notificarAdmins('💰 Pago Recibido', `Pago de C$ ${resultado.monto} recibido de ${resultado.alumnoNombre} (${mes}).`);

    // ⚡ MAGIA 2: Actualizar Dashboard en Tiempo Real
    this.eventsGateway.emitir('nuevo-pago', resultado);

    return resultado;
  }

  // --- PAGO EN LOTE (BATCH) ---
  // TU LÓGICA ORIGINAL + NOTIFICACIONES
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
      return []; 
    }

    const pagosAGuardar = mesesAGuardar.map(mes => 
       this.pagosRepository.create({
            alumnoId: alumnoId,
            alumnoNombre: alumnoNombre,
            monto: montoPorMes,
            mes: mes,
            fecha: fecha,
            estado: 'pagado',
       })
    );

    const nuevosPagos = await this.pagosRepository.save(pagosAGuardar);
    
    // Calcular total para la notificación
    const total = nuevosPagos.reduce((sum, p) => sum + Number(p.monto), 0);

    // 🔔 Notificar Batch
    this.notificarAdmins('💰 Pago Anual/Lote', `Se registraron ${nuevosPagos.length} pagos (Total: C$ ${total}) para ${alumnoNombre}.`);

    // ⚡ Evento en tiempo real
    this.eventsGateway.emitir('nuevo-pago-lote', { total, cantidad: nuevosPagos.length });

    return nuevosPagos;
  }

  // --- LEER TODOS ---
  findAll(): Promise<Pago[]> {
    return this.pagosRepository.find({ order: { fecha: 'DESC' } });
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

  // --- NUEVO MÉTODO PARA EL TUTOR ---
  async findByAlumnos(alumnoIds: string[]): Promise<Pago[]> {
    if (!alumnoIds || alumnoIds.length === 0) {
      return [];
    }
    
    return this.pagosRepository.find({
      where: { 
        alumnoId: In(alumnoIds) 
      },
      relations: ['alumno'], 
      order: { 
        fecha: 'DESC' 
      }
    });
  }

  // --- HELPER PRIVADO PARA NOTIFICAR ---
  private async notificarAdmins(titulo: string, mensaje: string) {
      try {
          const admins = await this.usersRepository.find({ where: { rol: 'propietario' } });
          for (const admin of admins) {
              await this.notificacionesService.crear(
                  admin.id,
                  titulo,
                  mensaje,
                  'pago'
              );
          }
      } catch (e) {
          console.error("Error enviando notificación:", e);
      }
  }
}