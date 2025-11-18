import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Asistencia } from '../asistencias/asistencia.entity';
import { Aviso } from '../avisos/aviso.entity';

@Injectable()
export class TutorService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Alumno) private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Asistencia) private asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Aviso) private avisoRepository: Repository<Aviso>,
  ) {}

  // Obtener resumen para el Dashboard
  async getResumen(userId: string) {
    // 1. Obtener hijos
    const hijos = await this.alumnoRepository.find({
      where: { tutorUserId: userId },
      relations: ['vehiculo'], // Para saber la ruta
    });

    const hijosIds = hijos.map(h => h.id);

    // 2. Obtener asistencia de HOY
    const hoy = new Date().toISOString().split('T')[0];
    const asistenciasHoy = await this.asistenciaRepository.find({
      where: {
        fecha: hoy,
      },
    });

    // Mapear estado de los hijos hoy
    const estadoHijos = hijos.map(hijo => {
      const asistencia = asistenciasHoy.find(a => a.alumnoId === hijo.id);
      let estado = 'pendiente';
      if (asistencia) estado = asistencia.estado;
      
      return {
        id: hijo.id,
        nombre: hijo.nombre,
        grado: hijo.grado,
        estadoHoy: estado, // 'presente', 'ausente', 'pendiente'
        horaRecogida: asistencia?.fechaCreacion || null, // Hora real del registro
      };
    });

    // 3. Último aviso importante
    const ultimoAviso = await this.avisoRepository.findOne({
      where: [{ destinatario: 'tutores' }, { destinatario: 'todos' }],
      order: { fechaCreacion: 'DESC' },
    });

    return {
      hijos: estadoHijos,
      ultimoAviso,
      // Mock de pagos por ahora (hasta que integres el módulo de pagos)
      pagos: {
        montoPendiente: 0, 
        estado: 'al_dia'
      }
    };
  }
// Historial de asistencias
  async getAsistencias(userId: string) {
    const hijos = await this.alumnoRepository.find({
      where: { tutorUserId: userId },
    });
    
    // Usamos Promise.all para resolver el error de tipo y mejorar rendimiento
    const historial = await Promise.all(hijos.map(async (hijo) => {
      const registros = await this.asistenciaRepository.find({
        where: { alumnoId: hijo.id },
        order: { fecha: 'DESC' },
        take: 30 // Últimos 30 registros
      });
      
      return {
        ...hijo,
        registros
      };
    }));

    return historial;
  }
}