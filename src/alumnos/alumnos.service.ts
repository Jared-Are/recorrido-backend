import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Alumno } from './alumno.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { getSiguienteGrado } from './alumnos.utility'; // 👈 Importamos la lógica de promoción

@Injectable()
export class AlumnosService {
    constructor(
        @InjectRepository(Alumno) private alumnosRepository: Repository<Alumno>,
        @InjectRepository(User) private usersRepository: Repository<User>,
        private usersService: UsersService,
    ) {}

    // --- CREAR ALUMNO CON ASIGNACIÓN INTELIGENTE ---
    async create(data: any, creatorId: string) {
        let tutorId = creatorId;

        if (data.tutor && data.tutor.telefono) {
            const telefonoTutor = data.tutor.telefono.trim();
            const nombreTutor = data.tutor.nombre?.trim() || "Tutor sin nombre";

            let padreEncontrado = await this.usersRepository.findOne({ 
                where: { telefono: telefonoTutor } 
            });

            if (padreEncontrado) {
                console.log(`✅ Tutor existente encontrado: ${padreEncontrado.nombre} (${padreEncontrado.id})`);
                tutorId = padreEncontrado.id;
            } else {
                console.log(`🆕 Creando nuevo Tutor para: ${nombreTutor}`);
                try {
                    const nuevoPadre = await this.usersService.create({
                        nombre: nombreTutor,
                        telefono: telefonoTutor,
                        rol: 'tutor',
                    });
                    tutorId = nuevoPadre.id;
                } catch (error) {
                    console.error("Error al crear tutor automático:", error);
                    throw new BadRequestException("No se pudo registrar al tutor automáticamente. Verifica el teléfono.");
                }
            }
        }

        const { tutor, ...datosAlumno } = data;

        const nuevoAlumno = this.alumnosRepository.create({
            ...datosAlumno,
            tutor: typeof tutor === 'object' ? tutor.nombre : tutor,
            contacto: typeof tutor === 'object' ? tutor.telefono : '',
            tutorUserId: tutorId, 
            activo: true
        });

        return await this.alumnosRepository.save(nuevoAlumno);
    }
    
    // --- NUEVO: FUNCIÓN DE PROMOCIÓN MASIVA (MANTENIMIENTO ANUAL) ---
    async promoverAlumnos() {
        // 1. Obtener todos los alumnos activos
        const alumnos = await this.alumnosRepository.find({ where: { activo: true } });

        if (alumnos.length === 0) {
            return { message: "No hay alumnos activos para promover." };
        }

        const cambios = alumnos.map(alumno => {
            const siguienteGrado = getSiguienteGrado(alumno.grado);

            if (siguienteGrado === 'GRADUADO') {
                // Caso 1: Graduación (6° Primaria -> Inactivo)
                return {
                    ...alumno,
                    grado: 'Graduado', // Cambiamos el grado a Graduado para el registro
                    activo: false, // Se desactiva para que no salga en las listas de asistencia/cobro
                };
            } else if (siguienteGrado) {
                // Caso 2: Promoción Normal
                return {
                    ...alumno,
                    grado: siguienteGrado,
                };
            }
            // Caso 3: Si el grado no está en el mapa, lo dejamos como está.
            return alumno;
        });

        // 2. Guardar todos los cambios en la BD
        await this.alumnosRepository.save(cambios);

        return { 
            message: "Promoción y Graduación completada. El ciclo escolar de cobros se reinicia.",
            totalAlumnos: alumnos.length, 
            promovidos: cambios.filter(c => c.activo && c.grado !== c.grado).length,
            graduados: cambios.filter(c => c.grado === 'Graduado').length
        };
    }
    // ----------------------------------------------------------------

    // --- BUSCAR TODOS ---
    async findAll(estado?: string) {
        const query = this.alumnosRepository.createQueryBuilder('alumno')
            .leftJoinAndSelect('alumno.tutorUser', 'tutor')
            .leftJoinAndSelect('alumno.vehiculo', 'vehiculo')
            .orderBy('alumno.nombre', 'ASC');

        if (estado === 'activo') {
            query.andWhere('alumno.activo = :activo', { activo: true });
        } else if (estado === 'inactivo') {
            query.andWhere('alumno.activo = :activo', { activo: false });
        }

        return await query.getMany();
    }

    // --- BUSCAR POR TUTOR ---
    async findByTutor(userId: string, estado?: string) {
        const query = this.alumnosRepository.createQueryBuilder('alumno')
            .leftJoinAndSelect('alumno.tutorUser', 'tutor')
            .leftJoinAndSelect('alumno.vehiculo', 'vehiculo')
            .where('alumno.tutorUserId = :userId', { userId }) 
            .orderBy('alumno.nombre', 'ASC');

        if (estado === 'activo') {
            query.andWhere('alumno.activo = :activo', { activo: true });
        } else if (estado === 'inactivo') {
            query.andWhere('alumno.activo = :activo', { activo: false });
        }

        return await query.getMany();
    }

    async findOne(id: string) {
        const alumno = await this.alumnosRepository.findOne({
            where: { id },
            relations: ['tutorUser', 'vehiculo']
        });
        if (!alumno) throw new NotFoundException(`Alumno con ID ${id} no encontrado`);
        return alumno;
    }

    async update(id: string, changes: any) {
        const alumno = await this.findOne(id);
        this.alumnosRepository.merge(alumno, changes);
        return await this.alumnosRepository.save(alumno);
    }

    async remove(id: string) {
        const alumno = await this.findOne(id);
        // Nota: Esto ejecuta un DELETE físico. Para borrado lógico usa:
        // alumno.activo = false; 
        // return await this.alumnosRepository.save(alumno);
        return await this.alumnosRepository.remove(alumno);
    }
}