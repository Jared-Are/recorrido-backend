import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Asistencia } from '../asistencias/asistencia.entity';
import { Aviso } from '../avisos/aviso.entity';
import { PagosService } from '../pagos/pagos.service'; 

@Injectable()
export class TutorService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Alumno) private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Asistencia) private asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Aviso) private avisoRepository: Repository<Aviso>,
    private readonly pagosService: PagosService, 
  ) {}

  // 1. Resumen para el Dashboard
  async getResumen(userId: string) {
    const hijos = await this.alumnoRepository.find({
      where: { tutorUserId: userId },
      relations: ['vehiculo'], // <-- IMPORTANTE: Traer la relación del vehículo para sacar la foto
    });

    const hoy = new Date().toISOString().split('T')[0];
    const asistenciasHoy = await this.asistenciaRepository.find({
      where: { fecha: hoy },
    });

    const estadoHijos = hijos.map(hijo => {
      const asistencia = asistenciasHoy.find(a => a.alumnoId === hijo.id);
      let estado = 'pendiente';
      if (asistencia) estado = asistencia.estado;
      
      return {
        id: hijo.id,
        nombre: hijo.nombre,
        grado: hijo.grado,
        estadoHoy: estado,
        horaRecogida: asistencia?.fechaCreacion || null,
        
        // --- NUEVO CAMPO PARA LA FOTO ---
        vehiculoFotoUrl: hijo.vehiculo?.fotoUrl || null 
      };
    });

    const avisos = await this.avisoRepository.find({
      where: [{ destinatario: 'tutores' }, { destinatario: 'todos' }],
      order: { fechaCreacion: 'DESC' },
      take: 5,
    });

    const hijosIds = hijos.map(h => h.id);
    const pagos = await this.pagosService.findByAlumnos(hijosIds);
    const pagosPendientes = pagos.filter(p => p.estado === 'pendiente');
    const montoPendiente = pagosPendientes.reduce((sum, p) => sum + Number(p.monto), 0);

    return {
      hijos: estadoHijos,
      avisos, 
      pagos: {
        montoPendiente: montoPendiente, 
        estado: montoPendiente > 0 ? 'pendiente' : 'al_dia'
      }
    };
  }

  // 2. Historial de asistencias
  async getAsistencias(userId: string) {
    const hijos = await this.alumnoRepository.find({
      where: { tutorUserId: userId },
    });
    
    const historial = await Promise.all(hijos.map(async (hijo) => {
      const registros = await this.asistenciaRepository.find({
        where: { alumnoId: hijo.id },
        order: { fecha: 'DESC' },
        take: 30 
      });
      
      return {
        ...hijo,
        registros
      };
    }));

    return historial;
  }

  // 3. Historial de Pagos
  async getPagos(userId: string) {
    const hijos = await this.alumnoRepository.find({
      where: { tutorUserId: userId },
      select: ['id'] 
    });

    if (hijos.length === 0) {
        return [];
    }

    const hijosIds = hijos.map(h => h.id);
    return this.pagosService.findByAlumnos(hijosIds);
  }
}