import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Asistencia } from '../asistencias/asistencia.entity';
import { Aviso } from '../avisos/aviso.entity';
// 1. IMPORTAR EL SERVICIO DE PAGOS
import { PagosService } from '../pagos/pagos.service'; 

@Injectable()
export class TutorService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Alumno) private alumnoRepository: Repository<Alumno>,
    @InjectRepository(Asistencia) private asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Aviso) private avisoRepository: Repository<Aviso>,
    // 2. INYECTAR EL SERVICIO DE PAGOS AQUÍ
    private readonly pagosService: PagosService, 
  ) {}

  // Obtener resumen para el Dashboard
  async getResumen(userId: string) {
    // 1. Obtener hijos
    const hijos = await this.alumnoRepository.find({
      where: { tutorUserId: userId },
      relations: ['vehiculo'], // Para saber la ruta
    });

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

    // 3. Obtener lista de avisos (Top 5)
    const avisos = await this.avisoRepository.find({
      where: [{ destinatario: 'tutores' }, { destinatario: 'todos' }],
      order: { fechaCreacion: 'DESC' },
      take: 5, // Traemos los últimos 5 para el contador
    });

    // (Opcional: Podrías calcular el monto pendiente real aquí usando this.pagosService si quisieras)

    return {
      hijos: estadoHijos,
      avisos, 
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

  // Historial de Pagos
  async getPagos(userId: string) {
    // LOG 1: Ver si llega el ID del tutor correcto
    console.log("🔎 1. Buscando hijos para Tutor ID:", userId);

    const hijos = await this.alumnoRepository.find({
      where: { tutorUserId: userId },
      select: ['id', 'nombre'] // Seleccionamos nombre para identificarlo fácil
    });

    // LOG 2: Ver qué hijos encontró
    console.log("🔎 2. Hijos encontrados:", JSON.stringify(hijos));

    if (hijos.length === 0) {
        console.log("⚠️ No se encontraron hijos. Retornando array vacío.");
        return [];
    }

    const hijosIds = hijos.map(h => h.id);
    // LOG 3: Ver los IDs exactos que vamos a buscar en pagos
    console.log("🔎 3. IDs de hijos para buscar pagos:", hijosIds);

    // Ahora sí funcionará porque pagosService está inyectado
    const pagos = await this.pagosService.findByAlumnos(hijosIds);
    
    // LOG 4: Ver qué pagos encontró la base de datos
    console.log(`🔎 4. Pagos encontrados: ${pagos.length}`);
    if (pagos.length > 0) {
        console.log("   Ejemplo de pago:", JSON.stringify(pagos[0]));
    }

    return pagos;
  }
}