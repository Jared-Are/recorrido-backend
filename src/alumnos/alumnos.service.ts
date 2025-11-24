import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from './alumno.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno)
    private alumnosRepository: Repository<Alumno>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService, // Inyectamos el servicio experto en usuarios
  ) {}

  // --- CREAR ALUMNO CON ASIGNACIÓN INTELIGENTE ---
  async create(data: any, creatorId: string) {
    let tutorId = creatorId; // Por defecto, el tutor es quien crea (si es un padre)

    // Si el que registra es Admin/Propietario, vendrán datos del tutor en 'data.tutor'
    if (data.tutor && data.tutor.telefono) {
        const telefonoTutor = data.tutor.telefono.trim();
        const nombreTutor = data.tutor.nombre?.trim() || "Tutor sin nombre";

        // 1. BÚSQUEDA: ¿Ya existe este tutor por teléfono?
        let padreEncontrado = await this.usersRepository.findOne({ 
            where: { telefono: telefonoTutor } 
        });

        if (padreEncontrado) {
            // 2a. SI EXISTE: Usamos su ID. ¡Aquí evitamos duplicados!
            console.log(`✅ Tutor existente encontrado: ${padreEncontrado.nombre} (${padreEncontrado.id})`);
            tutorId = padreEncontrado.id;
        } else {
            // 2b. NO EXISTE: Lo creamos usando UsersService (que maneja Supabase y todo)
            console.log(`🆕 Creando nuevo Tutor para: ${nombreTutor}`);
            try {
                const nuevoPadre = await this.usersService.create({
                    nombre: nombreTutor,
                    telefono: telefonoTutor,
                    rol: 'tutor', // Forzamos rol tutor
                    // UsersService generará username, password temporal y auth_id automáticamente
                });
                tutorId = nuevoPadre.id;
            } catch (error) {
                console.error("Error al crear tutor automático:", error);
                // Si falla (ej. teléfono inválido), lanzamos error claro
                throw new BadRequestException("No se pudo registrar al tutor automáticamente. Verifica el teléfono.");
            }
        }
    }

    // 3. ASIGNACIÓN: Creamos el alumno vinculado al ID del tutor (viejo o nuevo)
    // Desestructuramos para sacar 'tutor' del objeto, ya que no es columna directa en Alumno
    const { tutor, ...datosAlumno } = data;

    const nuevoAlumno = this.alumnosRepository.create({
        ...datosAlumno,
        tutor: typeof tutor === 'object' ? tutor.nombre : tutor, // Guardamos nombre texto por compatibilidad
        contacto: typeof tutor === 'object' ? tutor.telefono : '', // Guardamos contacto texto por compatibilidad
        tutorUserId: tutorId, // 🔗 LA RELACIÓN IMPORTANTE (Foreign Key)
        activo: true
    });

    return await this.alumnosRepository.save(nuevoAlumno);
  }

  // --- 👑 BUSCAR TODOS (Para Admin/Propietario) ---
  async findAll(estado?: string) {
    const query = this.alumnosRepository.createQueryBuilder('alumno')
        .leftJoinAndSelect('alumno.tutorUser', 'tutor') // Datos del usuario tutor
        .leftJoinAndSelect('alumno.vehiculo', 'vehiculo')
        .orderBy('alumno.nombre', 'ASC');

    if (estado === 'activo') {
        query.andWhere('alumno.activo = :activo', { activo: true });
    } else if (estado === 'inactivo') {
        query.andWhere('alumno.activo = :activo', { activo: false });
    }

    return await query.getMany();
  }

  // --- 👨‍👩‍👧‍👦 BUSCAR POR TUTOR (Para el Dashboard del Padre) ---
  async findByTutor(userId: string, estado?: string) {
    const query = this.alumnosRepository.createQueryBuilder('alumno')
        .leftJoinAndSelect('alumno.tutorUser', 'tutor')
        .leftJoinAndSelect('alumno.vehiculo', 'vehiculo')
        .where('alumno.tutorUserId = :userId', { userId }) // 🔒 Solo sus hijos
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
    return await this.alumnosRepository.remove(alumno);
  }
}