import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// Importamos In para buscar múltiples IDs
import { Repository, In } from 'typeorm'; 
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
        // Buscamos hijos y su vehículo
        const hijos = await this.alumnoRepository.find({
            where: { tutorUserId: userId }, 
            relations: ['vehiculo'], // Incluir el vehículo para la foto
        });

        if (hijos.length === 0) {
             throw new NotFoundException("No hay alumnos vinculados a esta cuenta.");
        }

        const hoy = new Date().toISOString().split('T')[0];
        
        // Obtenemos IDs de los hijos
        const hijosIds = hijos.map(h => h.id);
        
        // CORRECCIÓN 1: Usamos In(hijosIds) para buscar múltiples asistencias de una vez
        // Buscamos asistencias donde el ID del alumno esté DENTRO del array de IDs de hijos.
        const asistenciasHoy = await this.asistenciaRepository.find({
            where: { 
                 alumno: { id: In(hijosIds) }, // <--- CORRECCIÓN CLAVE
                 fecha: hoy 
            },
            relations: ['alumno']
        });

        // Mapear hijos y su estado
        const estadoHijos = hijos.map(hijo => {
            // Buscamos la asistencia de este hijo en el grupo de asistencias de hoy
            const asistencia = asistenciasHoy.find(a => a.alumno.id === hijo.id);
            let estado = 'pendiente';
            if (asistencia) estado = asistencia.estado;
            
            return {
                id: hijo.id,
                nombre: hijo.nombre,
                grado: hijo.grado,
                estadoHoy: estado,
                // CORRECCIÓN 2: Cambiamos 'createdAt' por 'fechaCreacion'
                horaRecogida: asistencia?.fechaCreacion || null, 
                vehiculoFotoUrl: hijo.vehiculo?.fotoUrl || null 
            };
        });

        // Avisos 
        const avisos = await this.avisoRepository.find({
            where: [{ destinatario: 'tutores' }, { destinatario: 'todos' }],
            order: { fechaCreacion: 'DESC' },
            take: 5,
        });

        // Pagos pendientes
        const pagos = await this.pagosService.findByAlumnos(hijosIds);
        const montoPendiente = pagos
            .filter(p => p.estado === 'pendiente')
            .reduce((sum, p) => sum + Number(p.monto || 0), 0);

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
    
    // 4. Obtener avisos
    async getAvisos(userId: string) {
         return this.avisoRepository.find({
             where: [{ destinatario: 'tutores' }, { destinatario: 'todos' }],
             order: { fechaCreacion: 'DESC' },
         });
    }
}